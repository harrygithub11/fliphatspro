
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('admin_id');
        const type = searchParams.get('type'); // 'all', 'notes', 'system'

        let query = `
            SELECT 
                c.id as customer_id,
                c.name as customer_name,
                c.email as customer_email,
                c.avatar_url,
                MAX(i.created_at) as last_activity_at,
                COUNT(i.id) as activity_count,
                JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'id', i.id,
                        'type', i.type,
                        'content', i.content,
                        'created_at', i.created_at,
                        'created_by', i.created_by,
                        'created_by_name', a.name
                    )
                ) as activities
            FROM interactions i
            LEFT JOIN customers c ON i.customer_id = c.id
            LEFT JOIN admins a ON i.created_by = a.id
            WHERE 1=1
        `;

        const params: any[] = [];

        if (adminId && adminId !== 'all') {
            query += ` AND i.created_by = ? `;
            params.push(adminId);
        }

        if (type === 'notes') {
            query += ` AND i.type IN ('call_log', 'email_sent', 'whatsapp_msg', 'internal_note') `;
        } else if (type === 'system') {
            query += ` AND i.type = 'system_event' `;
        }

        query += ` GROUP BY c.id ORDER BY last_activity_at DESC LIMIT 50`;

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(query, params);

            // Sort activities inside each thread (JSON_ARRAYAGG doesn't guarantee order)
            const threads = rows.map((row: any) => ({
                ...row,
                activities: (row.activities || []).sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            }));

            return NextResponse.json({ success: true, threads });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Fetch Activity Threads Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
