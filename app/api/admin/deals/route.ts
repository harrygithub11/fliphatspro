
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logInteraction } from '@/lib/crm';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer_id, amount, status } = body;

        const connection = await pool.getConnection();
        try {
            // Create Order
            const [res]: any = await connection.execute(
                'INSERT INTO orders (customer_id, amount, status, proposal_status, razorpay_order_id) VALUES (?, ?, ?, ?, ?)',
                [customer_id, amount, status || 'initiated', 'draft', `MANUAL_${Date.now()}`]
            );

            const orderId = res.insertId;

            // Log Interaction
            await logInteraction(
                customer_id,
                orderId,
                'system_event',
                `Manual deal created: ₹${amount}`
            );

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                // Fetch customer name
                const [cust]: any = await connection.execute('SELECT name FROM customers WHERE id = ?', [customer_id]);
                const customerName = cust[0]?.name || 'Unknown';

                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'deal_create',
                    `Created manual deal: Rs. ${amount} for ${customerName}`,
                    'order',
                    orderId
                );
            }

            return NextResponse.json({ success: true, orderId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create deal' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id || Object.keys(updates).length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid update' }, { status: 400 });
        }

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(', ');

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `UPDATE orders SET ${setClause} WHERE id = ?`,
                [...values, id]
            );

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                const changes = Object.entries(updates)
                    .map(([key, value]) => `${key} to '${value}'`)
                    .join(', ');

                await logAdminActivity(
                    session.id,
                    'deal_update',
                    `Updated deal #${id}: ${changes}`,
                    'order',
                    id
                );
            }
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update deal' }, { status: 500 });
    }
}
