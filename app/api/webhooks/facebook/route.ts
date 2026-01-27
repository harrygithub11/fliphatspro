import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure dynamic for incoming webhooks

// Helper to get settings from DB
// Helper to get settings from DB
async function getSetting(key: string) {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            'SELECT `value` FROM system_settings WHERE `key` = ?',
            [key]
        );
        return rows.length > 0 ? rows[0].value : null;
    } catch (e) {
        console.error(`Error fetching setting ${key}:`, e);
        return null;
    } finally {
        connection.release();
    }
}

// 1. Verification (GET)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = await getSetting('webhook_verify_token');

    if (mode === 'subscribe' && token === verifyToken) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse('Forbidden', { status: 403 });
}

// 2. Lead Capture (POST)
export async function POST(request: Request) {
    try {
        console.log('--- FB WEBHOOK POST HIT ---');
        const bodyText = await request.text();
        const signature = request.headers.get('x-hub-signature-256');
        const appSecret = await getSetting('facebook_app_secret');

        // Verify Signature
        if (appSecret && signature) {
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', appSecret)
                .update(bodyText)
                .digest('hex');

            if (signature !== expectedSignature) {
                console.warn('Invalid X-Hub-Signature');
                return new NextResponse('Invalid Signature', { status: 401 });
            }
        }

        const body = JSON.parse(bodyText);

        if (body.object === 'page') {
            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        await processLead(change.value);
                    }
                }
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Webhook Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

async function processLead(value: any) {
    const leadgenId = value.leadgen_id;
    const pageId = value.page_id;
    const formId = value.form_id;

    console.log(`Processing Lead: ${leadgenId} from Page: ${pageId}`);

    // Fetch Page Access Token (System Level? Or Tenant Level?)
    // Assuming App Access Token is verified globally, but Page Token might be tenant specific?
    // Let's assume we use a System Page Token or we fetch tenant's token.
    // Actually, usually each tenant connects their own page. So we should find the tenant by Page ID first.

    const connection = await pool.getConnection();
    let tenantId = null;
    let pageAccessToken = null;

    try {
        // 1. Identify Tenant by Page ID
        const [settings]: any = await connection.execute(
            `SELECT tenant_id FROM site_settings WHERE setting_key = 'facebook_page_id' AND setting_value = ?`,
            [pageId]
        );

        if (settings.length === 0) {
            console.error(`No tenant found for Facebook Page ID: ${pageId}`);
            return;
        }
        tenantId = settings[0].tenant_id;

        // 2. Fetch Tenant's Page Access Token
        const [tokenRows]: any = await connection.execute(
            `SELECT setting_value FROM site_settings WHERE tenant_id = ? AND setting_key = 'facebook_access_token'`,
            [tenantId]
        );

        if (tokenRows.length > 0) {
            pageAccessToken = tokenRows[0].setting_value;
        } else {
            // Fallback to global if needed? Unlikely for SaaS.
            pageAccessToken = await getSetting('facebook_access_token');
        }

        if (!pageAccessToken) {
            console.error('No Page Access Token found for tenant', tenantId);
            return;
        }

        // Fetch Lead Details from Graph API
        const response = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageAccessToken}`);
        if (!response.ok) {
            const err = await response.text();
            console.error('Failed to fetch lead from FB:', err);
            return;
        }

        const leadData = await response.json();
        console.log('--- FB LEAD DATA RECEIVED ---');
        console.log(JSON.stringify(leadData, null, 2));

        // Smart Field Mapping
        let email = null;
        let name = null;
        let phone = null;
        const otherFields: any = {};

        // Helper to normalize strings
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

        if (leadData.field_data) {
            for (const field of leadData.field_data) {
                const key = normalize(field.name);
                const val = field.values[0];

                if (!val) continue;

                // Email Detection
                if (key.includes('email')) {
                    email = val;
                }
                // Name Detection
                else if (key.includes('name') || key.includes('fullname')) {
                    name = val;
                }
                // Phone Detection
                else if (key.includes('phone') || key.includes('mobile') || key.includes('contact')) {
                    phone = val;
                }
                else {
                    otherFields[field.name] = val;
                }
            }
        }

        // Ad Data (Save Everything)
        const adData = {
            ...leadData, // Save raw data
            mapped_fields: { email, name, phone },
            other_fields: otherFields,
            form_source: leadData.form_name || `Form ${formId}`
        };

        // Upsert Customer (Tenant Scoped)

        // Check if facebook_lead_id exists for this tenant
        const [existingFb] = await connection.execute(
            'SELECT id FROM customers WHERE facebook_lead_id = ? AND tenant_id = ?',
            [leadgenId, tenantId]
        );

        if ((existingFb as any).length > 0) {
            console.log('Lead already exists (by FB ID)');
            return;
        }

        // Check by email if available (Tenant Scoped)
        let customerId = null;
        if (email) {
            const [existingEmail] = await connection.execute(
                'SELECT id FROM customers WHERE email = ? AND tenant_id = ?',
                [email, tenantId]
            );
            if ((existingEmail as any).length > 0) {
                customerId = (existingEmail as any)[0].id;
            }
        }

        if (customerId) {
            // Update existing customer
            await connection.execute(
                `UPDATE customers 
                    SET facebook_lead_id = ?, 
                        ad_data = ?,
                        source = IF(source IS NULL OR source = '', 'Facebook Lead Form', source)
                    WHERE id = ? AND tenant_id = ?`,
                [leadgenId, JSON.stringify(adData), customerId, tenantId]
            );
            console.log(`Updated Customer #${customerId} with FB Lead info`);

            await connection.execute(
                `INSERT INTO admin_activity_logs (tenant_id, action_type, action_description, entity_type, entity_id)
                    VALUES (?, ?, ?, ?, ?)`,
                [tenantId, 'lead_merged', `Merged FB Lead: ${name || email || leadgenId}`, 'customer', customerId]
            );

        } else {
            // Create new customer with tenant_id
            const safeName = name || `FB Lead ${leadgenId.substr(-4)}`;
            const safeEmail = email || `fb-lead-${leadgenId}@placeholder.com`;

            const [result] = await connection.execute(
                `INSERT INTO customers (tenant_id, name, email, phone, source, stage, score, facebook_lead_id, ad_data)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    tenantId,
                    safeName,
                    safeEmail,
                    phone,
                    `FB: ${adData.form_source}`,
                    'new',
                    'cold',
                    leadgenId,
                    JSON.stringify(adData)
                ]
            );
            const newId = (result as any).insertId;
            console.log(`Created new Customer #${newId} from FB Lead`);

            await connection.execute(
                `INSERT INTO admin_activity_logs (tenant_id, action_type, action_description, entity_type, entity_id)
                    VALUES (?, ?, ?, ?, ?)`,
                [tenantId, 'lead_created', `New FB Lead: ${safeName}`, 'customer', newId]
            );
        }

    } catch (err) {
        console.error('Error fetching/saving lead:', err);
    } finally {
        connection.release();
    }
}
