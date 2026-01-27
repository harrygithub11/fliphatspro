/**
 * Run Campaign API
 * POST /api/marketing/campaigns/[id]/run
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAuth } from '@/lib/auth'
import { runCampaign } from '@/lib/campaign-runner'

export const dynamic = 'force-dynamic'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id

        // Check for force flag in body
        let options = {}
        try {
            const body = await request.json()
            if (body && body.force) {
                options = { force: true }
            }
        } catch (e) {
            // Body might be empty or invalid JSON, ignore
        }

        const result = await runCampaign(campaignId, tenantId, options)

        if (!result.success) {
            return NextResponse.json(result, { status: result.error?.includes('not found') ? 404 : 500 })
        }

        return NextResponse.json(result)

    } catch (error: any) {
        console.error('[CAMPAIGN_RUN_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Failed to run campaign' }, { status: 500 })
    }
}
