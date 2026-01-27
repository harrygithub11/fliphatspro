import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Fetch timeline from interactions table (tenant-scoped)
export async function GET(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const adminId = searchParams.get('admin_id');

        const connection = await pool.getConnection();
        try {
            const params: any[] = [tenantId];

            let query = `
                SELECT 
                    i.id,
                    'interaction' AS source,
                    i.type AS action_type,
                    i.content AS description,
                    i.customer_id,
                    c.name AS customer_name,
                    i.created_by,
                    a.name AS created_by_name,
                    a.email AS created_by_email,
                    i.created_at
                FROM interactions i
                LEFT JOIN customers c ON i.customer_id = c.id
                LEFT JOIN users a ON i.created_by = a.id
                WHERE i.tenant_id = ? AND i.deleted_at IS NULL
            `;

            if (adminId && adminId !== 'all') {
                query += ` AND i.created_by = ?`;
                params.push(adminId);
            }

            query += ` ORDER BY i.created_at DESC LIMIT ${limit}`;

            const [interactions]: any = await connection.execute(query, params);

            return NextResponse.json({ success: true, interactions });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Timeline Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch timeline', error: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const body = await request.json();
        const { customer_id, type, content } = body;

        if (!customer_id || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                `INSERT INTO interactions (tenant_id, customer_id, type, content, created_by, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [tenantId, customer_id, type || 'internal_note', content, session.id]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'interaction_created',
                `Added ${type || 'note'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                'customer',
                customer_id
            );

            return NextResponse.json({
                success: true,
                interaction: {
                    id: result.insertId,
                    customer_id,
                    type: type || 'internal_note',
                    content,
                    created_by: session.id,
                    created_by_name: session.name,
                    created_at: new Date().toISOString()
                }
            });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Log Interaction Error", error);
        return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 });
    }
}
