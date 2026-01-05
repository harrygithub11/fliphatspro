import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { razorpay_payment_id, razorpay_order_id } = body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Find Order DB ID from Razorpay Order ID
            const [rows]: any = await connection.execute(
                'SELECT id, customer_id FROM orders WHERE razorpay_order_id = ?',
                [razorpay_order_id]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            const { id: orderDbId, customer_id: customerId } = rows[0];

            // 2. Update Order Status
            await connection.execute(
                'UPDATE orders SET status = ?, razorpay_payment_id = ?, onboarding_status = ? WHERE id = ?',
                ['paid', razorpay_payment_id, 'pending', orderDbId]
            );

            // 3. Log Success
            await connection.execute(
                'INSERT INTO interactions (customer_id, order_id, type, content, sentiment) VALUES (?, ?, ?, ?, ?)',
                [customerId, orderDbId, 'system_event', `Payment Successful (ID: ${razorpay_payment_id})`, 'positive']
            );

            // 4. Create Task for Admin
            await connection.execute(
                'INSERT INTO tasks (related_order_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)',
                [orderDbId, 'Monitor Onboarding', 'User paid, waiting for them to fill the form.', 'high', 'open']
            );

            await connection.commit();
            return NextResponse.json({ success: true });

        } catch (dbError) {
            await connection.rollback();
            console.error(dbError);
            return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Payment Verification Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
