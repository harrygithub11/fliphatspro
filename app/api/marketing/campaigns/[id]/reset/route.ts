
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const connection = await pool.getConnection()

        try {
            // Reset all leads for this campaign
            await connection.execute(
                `UPDATE campaign_lead 
                 SET status = 'active', currentStep = 0, nextStepDue = NULL 
                 WHERE campaignId = ?`,
                [campaignId]
            )

            // Clear logs? Optional. Let's keep logs but maybe mark them?
            // For now just reset leads.

        } finally {
            connection.release()
        }

        return NextResponse.json({ success: true, message: 'Campaign reset successfully' })

    } catch (error: any) {
        console.error('[RESET_ERROR]', error)
        return NextResponse.json({ success: false, error: 'Failed to reset' }, { status: 500 })
    }
}
