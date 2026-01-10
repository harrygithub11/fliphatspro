
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminId = searchParams.get('admin_id');
        const type = searchParams.get('type'); // 'all', 'notes', 'system'

        // 1. Fetch raw flattened data
        let query = `
            SELECT 
                i.id as activity_id,
                i.type,
                i.content,
                i.created_at,
                i.created_by,
                
                c.id as customer_id,
                c.name as customer_name,
                c.email as customer_email,
                c.avatar_url,

                a.name as admin_name
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

        query += ` ORDER BY i.created_at DESC LIMIT 200`; // Fetch more rows to aggregate

        const connection = await pool.getConnection();
        let threadsArr: any[] = [];

        try {
            const [rows]: any = await connection.execute(query, params);

            // 2. Group by customer in JS
            const threadsMap = new Map();
            const unknownCustomerKey = 'unknown_customer';

            for (const row of rows) {
                const customerId = row.customer_id || unknownCustomerKey;

                if (!threadsMap.has(customerId)) {
                    threadsMap.set(customerId, {
                        customer_id: row.customer_id,
                        customer_name: row.customer_name || 'Unknown User',
                        customer_email: row.customer_email,
                        avatar_url: row.avatar_url,
                        last_activity_at: row.created_at, // First row is latest due to DESC sort
                        activity_count: 0,
                        activities: []
                    });
                }

                const thread = threadsMap.get(customerId);
                thread.activity_count++;
                thread.activities.push({
                    id: row.activity_id,
                    type: row.type,
                    content: row.content,
                    created_at: row.created_at,
                    created_by: row.created_by,
                    created_by_name: row.admin_name
                });
            }

            // Convert to array
            threadsArr = Array.from(threadsMap.values());

        } finally {
            connection.release();
        }

        return NextResponse.json({ success: true, threads: threadsArr });
    } catch (error: any) {
        console.error("Fetch Activity Threads Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
