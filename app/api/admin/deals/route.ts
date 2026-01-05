
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
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update deal' }, { status: 500 });
    }
}
