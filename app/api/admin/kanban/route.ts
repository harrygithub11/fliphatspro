import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logInteraction } from '@/lib/crm';

export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            // Get all orders
            const [orders]: any = await connection.execute(`
                SELECT 
                    o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                    c.name as customer_name, c.email as customer_email, c.id as customer_id,
                    ps.brand_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                ORDER BY o.created_at DESC
            `);

            // Get leads (customers without any orders)
            const [leads]: any = await connection.execute(`
                SELECT 
                    c.id as customer_id,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.created_at,
                    'new_lead' as status,
                    NULL as id,
                    NULL as razorpay_order_id,
                    NULL as amount,
                    NULL as brand_name
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id
                WHERE o.id IS NULL
                ORDER BY c.created_at DESC
            `);

            // Combine orders and leads
            const combined = [...orders, ...leads];

            return NextResponse.json(combined);
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { orderId, newStatus } = body;

        const connection = await pool.getConnection();
        try {
            await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);

            // Log this move
            const [rows]: any = await connection.execute('SELECT customer_id FROM orders WHERE id = ?', [orderId]);
            const customerId = rows[0]?.customer_id || null;

            await logInteraction(customerId, orderId, 'system_event', `Order status updated to ${newStatus} `);

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
