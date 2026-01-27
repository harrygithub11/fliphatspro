
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { runCampaign } from '@/lib/campaign-runner'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const CRON_SECRET = process.env.CRON_SECRET || 'fliphats_cron_secret'

    if (secret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized. Provide ?secret=' + CRON_SECRET }, { status: 401 })
    }

    try {
        const connection = await pool.getConnection()

        // Find all active campaigns (excluding soft deleted)
        const [campaigns]: any = await connection.execute(
            `SELECT id, tenant_id, name FROM marketing_campaign WHERE status = 'active' AND deleted_at IS NULL`
        )
        connection.release()

        console.log(`[CRON] Found ${campaigns.length} active campaigns`)

        const results = []
        for (const campaign of campaigns) {
            console.log(`[CRON] Processing campaign ${campaign.id} (${campaign.name})`)
            const res = await runCampaign(campaign.id, campaign.tenant_id)
            results.push({
                campaign: campaign.name,
                id: campaign.id,
                result: res
            })
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            campaignsProcessed: campaigns.length,
            details: results
        })

    } catch (error: any) {
        console.error('[CRON_ERROR]', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
