import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            // Fetch Customers with LTV and Last Order Date + Status
            const [rows]: any = await connection.execute(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT o.id) as total_orders,
                    MAX(o.created_at) as last_order_date,
                    (SELECT status FROM orders WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as order_status,
                    (SELECT source FROM orders WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as order_source,
                    (SELECT COUNT(*) FROM interactions WHERE customer_id = c.id) as total_activities,
                    (SELECT COUNT(*) FROM interactions 
                     WHERE customer_id = c.id 
                     AND created_at > COALESCE((SELECT last_read_at FROM lead_reads WHERE lead_id = c.id AND admin_id = ?), '1970-01-01')) as new_activity_count
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `, [1]); // TODO: Use actual current user ID from session/auth
            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, source, location, budget, notes, platform, campaign_name, ad_name } = body;

        if (!name || !email) {
            return NextResponse.json({ success: false, message: 'Name and Email are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'INSERT INTO customers (name, email, phone, source, location, budget, notes, platform, campaign_name, ad_name, stage, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone || '', source || 'Manual', location || '', budget || 0, notes || '', platform || '', campaign_name || '', ad_name || '', 'new', 'cold']
            );
            return NextResponse.json({ success: true, id: result.insertId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create lead' }, { status: 500 });
    }
}
