/**
 * Bulk Delete Campaign Leads API
 * DELETE /api/marketing/campaigns/[id]/leads/bulk
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAuth } from '@/lib/auth'
import pool from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection: any

    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const body = await request.json()
        const { leadIds } = body

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ success: false, error: 'No leads selected' }, { status: 400 })
        }

        connection = await pool.getConnection()

        // 1. Verify campaign belongs to tenant
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )

        if (campaigns.length === 0) {
            connection.release()
            return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
        }

        // 2. Delete leads from campaign (only for this campaign)
        const placeholders = leadIds.map(() => '?').join(',')
        const [result]: any = await connection.execute(
            `DELETE FROM campaign_lead WHERE campaignId = ? AND id IN (${placeholders})`,
            [campaignId, ...leadIds]
        )

        connection.release()

        return NextResponse.json({
            success: true,
            deleted: result.affectedRows,
            message: `Deleted ${result.affectedRows} leads from campaign`
        })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_LEADS_BULK_DELETE_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Failed to delete leads' }, { status: 500 })
    }
}
