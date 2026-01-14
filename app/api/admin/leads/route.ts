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
                     AND created_at > COALESCE((SELECT MAX(last_read_at) FROM lead_reads WHERE lead_id = c.id AND admin_id = ?), '1970-01-01')) as new_activity_count
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id
                GROUP BY c.id, c.created_at
                ORDER BY c.created_at DESC
            `, [1]); // TODO: Use actual current user ID from session/auth
            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error("Fetch Leads Error:", error);
        return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, phone, source, location, budget, notes, platform, campaign_name, ad_name, company, project_desc } = body;

        if (!name || !email) {
            return NextResponse.json({ success: false, message: 'Name and Email are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'INSERT INTO customers (name, email, phone, source, location, budget, notes, platform, campaign_name, ad_name, company, project_desc, stage, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [name, email, phone || '', source || 'Manual', location || '', budget || null, notes || '', platform || '', campaign_name || '', ad_name || '', company || '', project_desc || '', 'new', 'cold']
            );
            const leadId = result.insertId;

            // Log Interaction
            try {
                const { getSession } = await import('@/lib/auth');
                const session = await getSession();
                const adminId = session?.id || null;
                await connection.execute(
                    'INSERT INTO interactions (customer_id, type, content, created_by, created_at) VALUES (?, ?, ?, ?, NOW())',
                    [leadId, 'lead_created', `Lead created manually: ${name} (${email})`, adminId]
                );
            } catch (e) {
                console.error("Failed to log lead creation interaction:", e);
            }

            return NextResponse.json({ success: true, id: leadId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create lead' }, { status: 500 });
    }
}
