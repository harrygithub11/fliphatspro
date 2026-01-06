import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure dynamic for incoming webhooks

// Helper to get settings from DB
async function getSetting(key: string) {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            'SELECT setting_value FROM settings WHERE setting_key = ?',
            [key]
        );
        return rows.length > 0 ? rows[0].setting_value : null;
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
    const createdTime = value.created_time;

    console.log(`Processing Lead: ${leadgenId} from Page: ${pageId}`);

    // Fetch Page Access Token
    const pageAccessToken = await getSetting('facebook_access_token');
    if (!pageAccessToken) {
        console.error('No Page Access Token found');
        return;
    }

    // Fetch Lead Details from Graph API
    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${pageAccessToken}`);
        if (!response.ok) {
            const err = await response.text();
            console.error('Failed to fetch lead from FB:', err);
            return;
        }

        const leadData = await response.json();
        /*
          leadData example:
          {
            "id": "12345",
            "created_time": "...",
            "field_data": [
               { "name": "email", "values": ["test@example.com"] },
               { "name": "full_name", "values": ["John Doe"] },
               { "name": "phone_number", "values": ["+123..."] }
            ],
            "ad_id": "...",
            "ad_name": "...",
            "adset_id": "...",
            "campaign_id": "...",
            "campaign_name": "...",
            "form_id": "...",
            "form_name": "...",
            "is_organic": false,
            "platform": "fb",
          }
        */

        // Map Fields
        let email = null;
        let name = null;
        let phone = null;
        const otherFields: any = {};

        for (const field of leadData.field_data || []) {
            const val = field.values[0];
            if (field.name === 'email') email = val;
            else if (field.name === 'full_name' || field.name === 'name') name = val;
            else if (field.name === 'phone_number' || field.name === 'phone') phone = val;
            else otherFields[field.name] = val;
        }

        // Ad Data
        const adData = {
            ad_id: leadData.ad_id,
            ad_name: leadData.ad_name,
            campaign_id: leadData.campaign_id,
            campaign_name: leadData.campaign_name,
            form_id: leadData.form_id,
            form_name: leadData.form_name,
            platform: leadData.platform,
            other_fields: otherFields
        };

        // Upsert Customer
        const connection = await pool.getConnection();
        try {
            // Check if facebook_lead_id exists
            const [existingFb] = await connection.execute(
                'SELECT id FROM customers WHERE facebook_lead_id = ?',
                [leadgenId]
            );

            if ((existingFb as any).length > 0) {
                console.log('Lead already exists (by FB ID)');
                return; // Already processed
            }

            // Check by email if available
            let customerId = null;
            if (email) {
                const [existingEmail] = await connection.execute(
                    'SELECT id FROM customers WHERE email = ?',
                    [email]
                );
                if ((existingEmail as any).length > 0) {
                    customerId = (existingEmail as any)[0].id;
                }
            }

            if (customerId) {
                // Update existing customer with FB info
                await connection.execute(
                    `UPDATE customers 
                     SET facebook_lead_id = ?, 
                         ad_data = ?, 
                         source = IF(source = 'Website', 'Facebook Lead Form', source)
                     WHERE id = ?`,
                    [leadgenId, JSON.stringify(adData), customerId]
                );
                console.log(`Updated Customer #${customerId} with FB Lead info`);

                // Log activity
                await connection.execute(
                    `INSERT INTO admin_activity_logs (action_type, action_description, entity_type, entity_id)
                     VALUES (?, ?, ?, ?)`,
                    ['lead_merged', `Merged FB Lead ${leadData.form_name}`, 'customer', customerId]
                );

            } else {
                // Create new customer
                const [result] = await connection.execute(
                    `INSERT INTO customers (name, email, phone, source, stage, score, facebook_lead_id, ad_data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        name || 'Facebook Lead',
                        email,
                        phone,
                        'Facebook Lead Form',
                        'new',
                        'cold',
                        leadgenId,
                        JSON.stringify(adData)
                    ]
                );
                const newId = (result as any).insertId;
                console.log(`Created new Customer #${newId} from FB Lead`);

                // Log activity
                await connection.execute(
                    `INSERT INTO admin_activity_logs (action_type, action_description, entity_type, entity_id)
                     VALUES (?, ?, ?, ?)`,
                    ['lead_created', `New FB Lead from ${leadData.form_name}`, 'customer', newId]
                );
            }

        } finally {
            connection.release();
        }

    } catch (err) {
        console.error('Error fetching/saving lead:', err);
    }
}
