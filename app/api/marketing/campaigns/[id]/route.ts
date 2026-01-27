
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

// GET Single Campaign
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id

        const [rows]: any = await pool.execute(
            `SELECT * FROM marketing_campaign WHERE id = ? AND tenant_id = ?`,
            [campaignId, tenantId]
        )

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, campaign: rows[0] })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

// PATCH Update Campaign (Status, Name, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request)
        const campaignId = params.id
        const body = await request.json()
        const { status, name, description } = body

        if (status && !['draft', 'active', 'paused', 'completed'].includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }

        const updates = []
        const values = []

        if (status) {
            updates.push('status = ?')
            values.push(status)
        }
        if (name) {
            updates.push('name = ?')
            values.push(name)
        }
        if (description) {
            updates.push('description = ?')
            values.push(description)
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: true })
        }

        values.push(campaignId)
        values.push(tenantId)

        const query = `UPDATE marketing_campaign SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`

        const connection = await pool.getConnection()
        try {
            await connection.execute(query, values)
        } finally {
            connection.release()
        }

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
