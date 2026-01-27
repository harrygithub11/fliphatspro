
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        console.log('[API] Fetching logs for campaign:', campaignId)

        const connection = await pool.getConnection()
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS campaign_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    campaign_id VARCHAR(255) NOT NULL,
                    lead_id VARCHAR(255),
                    type VARCHAR(50) NOT NULL,
                    message TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_campaign (campaign_id),
                    INDEX idx_lead (lead_id)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `)

            const [logs]: any = await connection.execute(
                `SELECT 
                    l.id,
                    l.type,
                    l.message,
                    l.created_at,
                    cl.leadEmail
                 FROM campaign_logs l
                 LEFT JOIN campaign_lead cl ON l.lead_id = cl.id COLLATE utf8mb4_unicode_ci
                 WHERE l.campaign_id = ?
                 ORDER BY l.created_at DESC
                 LIMIT 100`,
                [campaignId]
            )
            console.log('[API] Found logs count:', logs.length)
            return NextResponse.json({ success: true, logs })
        } finally {
            connection.release()
        }

    } catch (error: any) {
        console.error('[API Error] Fetch Logs Failed:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
