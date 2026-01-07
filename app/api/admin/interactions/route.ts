import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch timeline from interactions table  
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const adminId = searchParams.get('admin_id');

        const connection = await pool.getConnection();
        try {
            // Build query dynamically
            const params: any[] = [];

            let query = `
                SELECT 
                    i.id,
                    'interaction' AS source,
                    i.type AS action_type,
                    i.content AS description,
                    i.customer_id,
                    c.name AS customer_name,
                    i.created_by AS admin_id,
                    a.name AS admin_name,
                    i.created_at
                FROM interactions i
                LEFT JOIN customers c ON i.customer_id = c.id
                LEFT JOIN admins a ON i.created_by = a.id
            `;

            if (adminId && adminId !== 'all') {
                query += ` WHERE i.created_by = ?`;
                params.push(adminId);
            }

            query += ` ORDER BY i.created_at DESC LIMIT ?`;
            params.push(limit);

            // Fetch from interactions table - the main timeline source
            const [interactions]: any = await connection.execute(query, params);

            // Try to also fetch admin_activity_logs (disable for now to debug)
            const activityLogs: any[] = [];
            /*
            try {
                const [logs]: any = await connection.execute(
                    `SELECT 
                        al.id,
                        'activity_log' AS source,
                        al.action_type,
                        al.action_description AS description,
                        al.entity_id AS customer_id,
                        NULL AS customer_name,
                        al.admin_id,
                        a.name AS admin_name,
                        al.created_at
                     FROM admin_activity_logs al
                     LEFT JOIN admins a ON al.admin_id = a.id
                     ORDER BY al.created_at DESC
                     LIMIT 100`
                );
                activityLogs = logs;
            } catch (e) {
                console.log('admin_activity_logs query failed', e);
            }
            */

            // Combine and sort by created_at
            const combined = [...interactions, ...activityLogs]
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 100);

            console.log(`Timeline API: ${interactions.length} interactions found`);

            return NextResponse.json({ success: true, interactions: combined });
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
        const session = await getSession();

        // Require authentication
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customer_id, type, content } = body;

        if (!customer_id || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                `INSERT INTO interactions (customer_id, type, content, created_by, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [customer_id, type || 'internal_note', content, session.id]
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

            // Return the created interaction with admin info
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
