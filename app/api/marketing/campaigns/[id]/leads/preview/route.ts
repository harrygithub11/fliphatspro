
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
        const searchParams = request.nextUrl.searchParams

        const search = searchParams.get('search') || ''
        const stage = searchParams.get('stage') || ''
        const score = searchParams.get('score') || ''
        const source = searchParams.get('source') || ''

        connection = await pool.getConnection()

        let query = `SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?`
        const values: any[] = [tenantId]

        if (search) {
            query += ` AND (name LIKE ? OR email LIKE ? OR company LIKE ?)`
            values.push(`%${search}%`, `%${search}%`, `%${search}%`)
        }

        if (stage) {
            query += ` AND stage = ?`
            values.push(stage)
        }

        if (score) {
            query += ` AND score = ?`
            values.push(score)
        }

        if (source) {
            query += ` AND source = ?`
            values.push(source)
        }

        const [rows]: any = await connection.execute(query, values)

        return NextResponse.json({ success: true, count: rows[0].count })

    } catch (error: any) {
        console.error('[LEADS_PREVIEW_ERROR]', error)
        return NextResponse.json({ error: 'Failed to preview leads' }, { status: 500 })
    } finally {
        if (connection) connection.release()
    }
}
