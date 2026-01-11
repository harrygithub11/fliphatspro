import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

// Helper to detect column names using fuzzy matching
function detectColumn(headers: string[], patterns: string[]): string | null {
    const normalized = headers.map(h => h.toLowerCase().trim());

    // First try exact match
    for (const pattern of patterns) {
        const index = normalized.findIndex(h => h === pattern);
        if (index !== -1) return headers[index];
    }

    // Then try includes match
    for (const pattern of patterns) {
        const index = normalized.findIndex(h => h.includes(pattern));
        if (index !== -1) return headers[index];
    }

    return null;
}

// Validate email format
function isValidEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Clean phone number
function cleanPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        // Read file content
        const text = await file.text();

        // Parse CSV
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Invalid CSV format',
                errors: parseResult.errors
            }, { status: 400 });
        }

        const rows = parseResult.data as Record<string, any>[];
        const headers = parseResult.meta.fields || [];

        if (headers.length === 0) {
            return NextResponse.json({ success: false, message: 'CSV has no columns' }, { status: 400 });
        }

        // Auto-detect columns (prioritize exact/specific matches)
        const namePatterns = ['full_name', 'full name', 'customer_name', 'customer name', 'contact_name', 'contact name', 'name', 'client_name', 'client name'];
        const phonePatterns = ['phone_number', 'phone number', 'mobile_number', 'mobile number', 'phone', 'mobile', 'cell', 'telephone', 'contact_number', 'contact number', 'number'];
        const emailPatterns = ['email_address', 'email address', 'email', 'e-mail', 'e_mail', 'contact_email', 'contact email', 'mail'];
        const timestampPatterns = ['created_time', 'created_at', 'submission_time', 'submitted_at', 'timestamp', 'date', 'created'];

        const nameCol = detectColumn(headers, namePatterns);
        const phoneCol = detectColumn(headers, phonePatterns);
        const emailCol = detectColumn(headers, emailPatterns);
        const timestampCol = detectColumn(headers, timestampPatterns);

        // Detect Campaign / Ad Name
        const campaignPatterns = ['campaign_name', 'campaign name', 'campaign', 'ad_name', 'ad name', 'adset_name', 'adset name', 'source_detail'];
        const campaignCol = detectColumn(headers, campaignPatterns);
        const adIdCol = detectColumn(headers, ['ad_id']);
        const adNameCol = detectColumn(headers, ['ad_name']);
        const adsetIdCol = detectColumn(headers, ['adset_id']);
        const adsetNameCol = detectColumn(headers, ['adset_name']);
        const campaignIdCol = detectColumn(headers, ['campaign_id']);
        const campaignNameCol = detectColumn(headers, ['campaign_name']); // Specific match
        const formIdCol = detectColumn(headers, ['form_id']);
        const formNameCol = detectColumn(headers, ['form_name']);
        const platformCol = detectColumn(headers, ['platform']);
        const isOrganicCol = detectColumn(headers, ['is_organic']);
        const leadStatusCol = detectColumn(headers, ['lead_status']);
        const fbLeadIdCol = detectColumn(headers, ['id', 'lead_id']); // "id" matches the user's sample





        // Detect Location
        const locationPatterns = ['location', 'city', 'address', 'region', 'state', 'country', 'place'];
        const locationCol = detectColumn(headers, locationPatterns);

        // Detect Budget
        const budgetPatterns = ['budget', 'ad_spend', 'amount', 'value', 'cost'];
        const budgetCol = detectColumn(headers, budgetPatterns);

        if (!nameCol && !emailCol) {
            return NextResponse.json({
                success: false,
                message: 'Could not detect name or email columns. CSV must have at least name or email column.',
                detectedColumns: { name: nameCol, phone: phoneCol, email: emailCol, location: locationCol }
            }, { status: 400 });
        }

        // Process rows
        const connection = await pool.getConnection();
        const results = {
            total: rows.length,
            imported: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            errors: [] as string[]
        };

        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const name = nameCol ? String(row[nameCol] || '').trim() : '';
                const phone = phoneCol ? cleanPhone(String(row[phoneCol] || '')) : '';
                const email = emailCol ? String(row[emailCol] || '').trim() : '';
                const location = locationCol ? String(row[locationCol] || '').trim() : null;
                const budgetRaw = budgetCol ? parseFloat(String(row[budgetCol] || '').replace(/[^0-9.]/g, '')) : 0;
                const budget = isNaN(budgetRaw) ? 0 : budgetRaw;

                // Parse timestamp if available
                let submissionTime = null;
                if (timestampCol && row[timestampCol]) {
                    const parsedDate = new Date(row[timestampCol]);
                    if (!isNaN(parsedDate.getTime())) {
                        submissionTime = parsedDate.toISOString().slice(0, 19).replace('T', ' ');
                    }
                }

                // Skip if no name and no email
                if (!name && !email) {
                    results.skipped++;
                    continue;
                }

                // Validate email if provided
                if (email && !isValidEmail(email)) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: Invalid email format "${email}"`);
                    continue;
                }

                try {
                    // Extract campaign name early for use in duplicate check and insert
                    const campaignName = campaignCol ? (String(row[campaignCol] || '').trim() || null) : null;

                    // Extract FB Fields
                    const adId = adIdCol ? String(row[adIdCol] || '') : null;
                    const adName = adNameCol ? String(row[adNameCol] || '') : null;
                    const adsetId = adsetIdCol ? String(row[adsetIdCol] || '') : null;
                    const adsetName = adsetNameCol ? String(row[adsetNameCol] || '') : null;
                    const campaignId = campaignIdCol ? String(row[campaignIdCol] || '') : null;
                    const specificCampaignName = campaignNameCol ? String(row[campaignNameCol] || '') : campaignName; // Prefer specific if available
                    const formId = formIdCol ? String(row[formIdCol] || '') : null;
                    const formName = formNameCol ? String(row[formNameCol] || '') : null;
                    const platform = platformCol ? String(row[platformCol] || '') : null;
                    const isOrganic = isOrganicCol ? String(row[isOrganicCol]) === 'true' : false;
                    const leadStatus = leadStatusCol ? String(row[leadStatusCol] || '') : null;
                    const fbLeadId = fbLeadIdCol ? String(row[fbLeadIdCol] || '') : null;

                    // Check for existing lead
                    let existingRows: any[] = [];
                    if (email || phone) {
                        const checkConditions: string[] = [];
                        const checkParams: string[] = [];
                        if (email) { checkConditions.push('email = ?'); checkParams.push(email); }
                        if (phone && phone.length > 5) { checkConditions.push('phone = ?'); checkParams.push(phone); } // minimal phone validation

                        if (checkConditions.length > 0) {
                            const [rows]: any = await connection.execute(
                                `SELECT * FROM customers WHERE ${checkConditions.join(' OR ')} LIMIT 1`,
                                checkParams
                            );
                            existingRows = rows;
                        }
                    }

                    if (existingRows.length > 0) {
                        const existing = existingRows[0];
                        const updates: string[] = [];
                        const updateParams: any[] = [];
                        const updatedFields: string[] = [];

                        // Enrichment Logic: Only update if existing is missing/empty and new has value

                        // 1. Campaign Name
                        if (campaignName && !existing.campaign_name) {
                            updates.push('campaign_name = ?');
                            updateParams.push(campaignName);
                            updatedFields.push('Campaign');
                        }

                        // 2. Phone
                        if (phone && !existing.phone) {
                            updates.push('phone = ?');
                            updateParams.push(phone);
                            updatedFields.push('Phone');
                        }

                        // 3. Name (only if unknown)
                        if (name && (!existing.name || existing.name === 'Unknown')) {
                            updates.push('name = ?');
                            updateParams.push(name);
                            updatedFields.push('Name');
                        }

                        // 4. Location
                        if (location && !existing.location) {
                            updates.push('location = ?');
                            updateParams.push(location);
                            updatedFields.push('Location');
                        }

                        // 5. FB Fields (Enrich if missing)
                        if (platform && !existing.platform) { updates.push('platform = ?'); updateParams.push(platform); }
                        if (adId && !existing.ad_id) { updates.push('ad_id = ?'); updateParams.push(adId); }
                        if (adName && !existing.ad_name) { updates.push('ad_name = ?'); updateParams.push(adName); }
                        if (adsetName && !existing.adset_name) { updates.push('adset_name = ?'); updateParams.push(adsetName); }
                        if (campaignId && !existing.campaign_id) { updates.push('campaign_id = ?'); updateParams.push(campaignId); }
                        if (fbLeadId && !existing.fb_lead_id) { updates.push('fb_lead_id = ?'); updateParams.push(fbLeadId); }


                        // 5. FB Fields (Enrich if missing)
                        if (platform && !existing.platform) { updates.push('platform = ?'); updateParams.push(platform); }
                        if (adId && !existing.ad_id) { updates.push('ad_id = ?'); updateParams.push(adId); }
                        if (adName && !existing.ad_name) { updates.push('ad_name = ?'); updateParams.push(adName); }
                        if (adsetName && !existing.adset_name) { updates.push('adset_name = ?'); updateParams.push(adsetName); }
                        if (campaignId && !existing.campaign_id) { updates.push('campaign_id = ?'); updateParams.push(campaignId); }
                        if (fbLeadId && !existing.fb_lead_id) { updates.push('fb_lead_id = ?'); updateParams.push(fbLeadId); }


                        if (updates.length > 0) {
                            updateParams.push(existing.id);
                            await connection.execute(
                                `UPDATE customers SET ${updates.join(', ')} WHERE id = ?`,
                                updateParams
                            );

                            // Log enrichment
                            await connection.execute(
                                `INSERT INTO interactions (customer_id, type, content, created_by) 
                                     VALUES (?, 'system_event', ?, ?)`,
                                [existing.id, `Lead enriched via import: Added ${updatedFields.join(', ')}`, session.id]
                            );

                            results.updated++;
                        } else {
                            results.skipped++;
                        }
                        continue;
                    }

                    // Insert customer with timestamp if available
                    const [insertResult]: any = await connection.execute(
                        `INSERT INTO customers (
                            name, phone, email, source, campaign_name, location, stage, score, owner, created_at,
                            ad_id, ad_name, adset_id, adset_name, campaign_id, form_id, form_name, is_organic, platform, fb_lead_status, fb_lead_id, fb_created_time, budget
                        ) 
                         VALUES (?, ?, ?, 'csv_import', ?, ?, 'new', 'cold', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            name || 'Unknown',
                            phone,
                            email,
                            specificCampaignName,
                            location,
                            session.name || 'unassigned',
                            submissionTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
                            adId, adName, adsetId, adsetName, campaignId, formId, formName, isOrganic, platform, leadStatus, fbLeadId, submissionTime, budget
                        ]
                    );

                    const customerId = insertResult.insertId;

                    // Create initial timeline entry if we have a timestamp
                    if (submissionTime) {
                        await connection.execute(
                            `INSERT INTO interactions (customer_id, type, content, created_by, created_at) 
                             VALUES (?, 'system_event', ?, ?, ?)`,
                            [
                                customerId,
                                'Lead submitted via form' + (campaignName ? ` (Campaign: ${campaignName})` : ''),
                                session.id,
                                submissionTime
                            ]
                        );
                    }

                    results.imported++;

                } catch (dbError: any) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: ${dbError.message}`);
                }
            }

            // Log activity using helper function
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'csv_import',
                `Imported ${results.imported} leads, Enriched ${results.updated} leads (${results.total} total rows, ${results.skipped} skipped, ${results.failed} failed)`
            );

        } finally {
            connection.release();
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${results.imported} leads and enriched ${results.updated} existing leads`,
            detectedColumns: {
                name: nameCol,
                phone: phoneCol,
                email: emailCol,
                timestamp: timestampCol
            },
            results
        });

    } catch (error) {
        console.error('CSV Import Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Import failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
