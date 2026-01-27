
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: List Campaigns
export async function GET(request: NextRequest) {
    let connection;
    try {
        const { tenantId, session } = await requireTenantAuth(request)
        connection = await pool.getConnection();


        const [campaigns]: any = await connection.execute(
            `SELECT * FROM marketing_campaign WHERE tenant_id = ? ORDER BY updatedAt DESC`,
            [tenantId]
        )

        connection.release()
        return NextResponse.json({ success: true, campaigns })
    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_LIST_ERROR]', error)
        return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }
}

// POST: Create Campaign
export async function POST(request: NextRequest) {
    let connection;
    try {
        const { tenantId, session } = await requireTenantAuth(request)
        const body = await request.json()
        const { name, description, type, accountId } = body

        if (!name || !accountId) {
            return NextResponse.json({ error: 'Name and Account ID required' }, { status: 400 })
        }

        connection = await pool.getConnection();
        const id = `cmp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        await connection.execute(
            `INSERT INTO marketing_campaign (id, tenant_id, accountId, name, description, type, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())`,
            [id, tenantId, accountId, name, description || '', type || 'sequence']
        )

        connection.release()
        return NextResponse.json({ success: true, campaign: { id, name, type, accountId } })

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_CREATE_ERROR]', error)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }
}
