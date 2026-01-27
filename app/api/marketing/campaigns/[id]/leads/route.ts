
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: List leads for a campaign
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        connection = await pool.getConnection()

        // Verify campaign logic
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )

        if (campaigns.length === 0) {
            connection.release()
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const [leads]: any = await connection.execute(
            `SELECT * FROM campaign_lead WHERE campaignId = ? ORDER BY joinedAt DESC LIMIT 100`,
            [campaignId]
        )

        connection.release()
        return NextResponse.json({ success: true, leads })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_LEADS_GET_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
}

// POST: Add leads to a campaign (Manual, Bulk, or Filter)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const body = await request.json()
        const { mode, emails, filters } = body

        console.log('[CAMPAIGN_LEADS_POST]', { campaignId, mode, emailCount: emails?.length, filters })

        connection = await pool.getConnection()

        // 1. Verify campaign
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )
        if (campaigns.length === 0) {
            connection.release()
            console.log('[CAMPAIGN_LEADS_POST] Campaign not found')
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        console.log('[CAMPAIGN_LEADS_POST] Campaign verified')

        let targetEmails: string[] = []

        // 2. Resolve Emails based on Mode
        if (mode === 'manual' || mode === 'csv') {
            if (!Array.isArray(emails) || emails.length === 0) {
                connection.release()
                return NextResponse.json({ error: 'No emails provided' }, { status: 400 })
            }
            targetEmails = emails
        } else if (mode === 'filter') {
            const safeFilters = filters || {}

            // Build query dynamically
            let query = `SELECT email FROM customers WHERE email IS NOT NULL AND email != '' AND tenant_id = ?`
            const values: any[] = [tenantId]

            if (safeFilters.search) {
                query += ` AND (name LIKE ? OR email LIKE ? OR company LIKE ?)`
                values.push(`%${safeFilters.search}%`, `%${safeFilters.search}%`, `%${safeFilters.search}%`)
            }
            if (safeFilters.stage) {
                query += ` AND stage = ?`
                values.push(safeFilters.stage)
            }
            if (safeFilters.score) {
                query += ` AND score = ?`
                values.push(safeFilters.score)
            }
            if (safeFilters.source) {
                query += ` AND source = ?`
                values.push(safeFilters.source)
            }

            const [rows]: any = await connection.execute(query, values)
            targetEmails = rows.map((r: any) => r.email)
            console.log('[CAMPAIGN_LEADS_POST] Filter query returned', targetEmails.length, 'emails')
        }

        if (targetEmails.length === 0) {
            connection.release()
            console.log('[CAMPAIGN_LEADS_POST] No matching leads found')
            return NextResponse.json({ success: true, count: 0, message: 'No matching leads found to add' })
        }

        // Deduplicate targetEmails to prevent "Duplicate entry" errors in downstream inserts
        targetEmails = Array.from(new Set(targetEmails))

        if (targetEmails.length === 0) {
            connection.release()
            return NextResponse.json({ success: true, count: 0, message: 'No matching leads found to add' })
        }

        // 2b. Sync with Customers (Create if missing) - Best effort, skip if it hangs
        console.log('[CAMPAIGN_LEADS_POST] Starting customer sync for', targetEmails.length, 'emails')
        try {
            // Only sync first 50 to prevent very long queries
            const emailsToSync = targetEmails.slice(0, 50)

            if (emailsToSync.length > 0) {
                const placeholders = emailsToSync.map(() => '?').join(',')
                const [existingCustomers]: any = await connection.execute(
                    `SELECT email FROM customers WHERE tenant_id = ? AND email IN (${placeholders})`,
                    [tenantId, ...emailsToSync]
                )
                const existingCustomerEmails = new Set(existingCustomers.map((c: any) => c.email))

                const missingEmails = emailsToSync.filter(e => !existingCustomerEmails.has(e))
                console.log('[CAMPAIGN_LEADS_POST] Missing customers to create:', missingEmails.length)

                if (missingEmails.length > 0) {
                    const customerPlaceholders = missingEmails.map(() => '(?, ?, "", "Marketing Campaign", NOW(), NOW(), "new", "cold", ?)').join(', ')
                    const customerValues: any[] = []

                    missingEmails.forEach(email => {
                        const name = email.split('@')[0]
                        customerValues.push(name, email, tenantId)
                    })

                    await connection.execute(
                        `INSERT IGNORE INTO customers (name, email, phone, source, created_at, updated_at, stage, score, tenant_id) VALUES ${customerPlaceholders}`,
                        customerValues
                    )
                    console.log('[CAMPAIGN_LEADS_POST] Created missing customers')
                }
            }
        } catch (e) {
            console.error('[CUSTOMER_SYNC_ERROR]', e)
        }
        console.log('[CAMPAIGN_LEADS_POST] Customer sync complete, proceeding to campaign insert')

        // 3. Bulk Insert into Campaign (Ignoring Duplicates within Campaign)
        console.log('[CAMPAIGN_LEADS_POST] Fetching existing campaign leads')
        const [existingRows]: any = await connection.execute(
            'SELECT leadEmail FROM campaign_lead WHERE campaignId = ?',
            [campaignId]
        )
        const existingSet = new Set(existingRows.map((r: any) => r.leadEmail))
        console.log('[CAMPAIGN_LEADS_POST] Existing campaign leads:', existingSet.size)

        // Filter out those ALREADY in the campaign
        const emailsToAdd = targetEmails.filter(e => !existingSet.has(e))
        const skippedCount = targetEmails.length - emailsToAdd.length

        console.log('[CAMPAIGN_LEADS_POST] Emails to add:', emailsToAdd.length, 'Skipped:', skippedCount)

        if (emailsToAdd.length === 0) {
            connection.release()
            console.log('[CAMPAIGN_LEADS_POST] All leads already in campaign, returning')
            return NextResponse.json({
                success: true,
                count: 0,
                skipped: skippedCount,
                message: skippedCount > 0 ? `All ${skippedCount} leads were already in the campaign` : 'No new leads found'
            })
        }

        // 3c. Insert New Campaign Leads
        console.log('[CAMPAIGN_LEADS_POST] Starting batch insert')
        let insertedCount = 0
        const batchSize = 100

        for (let i = 0; i < emailsToAdd.length; i += batchSize) {
            const batch = emailsToAdd.slice(i, i + batchSize)
            const placeholders = batch.map(() => '(?, ?, ?, ?, 0, NOW())').join(', ')
            const values: any[] = []

            batch.forEach(email => {
                const id = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 5)}`
                values.push(id, campaignId, email, 'active')
            })

            await connection.execute(
                `INSERT IGNORE INTO campaign_lead (id, campaignId, leadEmail, status, currentStep, nextStepDue) VALUES ${placeholders}`,
                values
            )
            insertedCount += batch.length
        }

        connection.release()
        console.log('[CAMPAIGN_LEADS_POST] SUCCESS - Inserted:', insertedCount, 'Skipped:', skippedCount)
        return NextResponse.json({
            success: true,
            count: insertedCount,
            skipped: skippedCount,
            leads: emailsToAdd.map(e => ({ leadEmail: e, status: 'active', joinedAt: new Date().toISOString() }))
        })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_LEAD_CREATE_ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
