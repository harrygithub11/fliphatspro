
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        connection = await pool.getConnection()

        // Verify campaign belongs to tenant
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )

        if (campaigns.length === 0) {
            connection.release()
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const [steps]: any = await connection.execute(
            'SELECT * FROM campaign_step WHERE campaignId = ? ORDER BY stepOrder ASC',
            [campaignId]
        )

        connection.release()
        return NextResponse.json({ success: true, steps })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_STEPS_GET_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const body = await request.json()
        const { type, subject, htmlBody, delaySeconds, stepOrder } = body

        connection = await pool.getConnection()

        // Verify campaign logic...
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )
        if (campaigns.length === 0) {
            connection.release()
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        const id = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        await connection.execute(
            `INSERT INTO campaign_step (id, campaignId, type, subject, htmlBody, delaySeconds, stepOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, campaignId, type, subject || null, htmlBody || null, delaySeconds || 0, stepOrder || 0]
        )

        connection.release()
        return NextResponse.json({ success: true, step: { id, ...body } })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_STEP_CREATE_ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const body = await request.json()
        const { id, type, subject, htmlBody, delaySeconds, stepOrder } = body

        if (!id) {
            return NextResponse.json({ error: 'Step ID required' }, { status: 400 })
        }

        connection = await pool.getConnection()

        // Verify campaign logic...
        const [campaigns]: any = await connection.execute(
            'SELECT id FROM marketing_campaign WHERE id = ? AND tenant_id = ?',
            [campaignId, tenantId]
        )
        if (campaigns.length === 0) {
            connection.release()
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }

        await connection.execute(
            `UPDATE campaign_step SET type = ?, subject = ?, htmlBody = ?, delaySeconds = ?, stepOrder = ? WHERE id = ? AND campaignId = ?`,
            [type, subject || null, htmlBody || null, delaySeconds || 0, stepOrder || 0, id, campaignId]
        )

        connection.release()
        return NextResponse.json({ success: true, step: body })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_STEP_UPDATE_ERROR]', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
