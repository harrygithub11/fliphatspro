import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import pool from '@/lib/db';

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount = 5000, name, email, phone, store_name, source = 'website' } = body;

        // 1. Razorpay Order
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: 'rcpt_' + Date.now(),
        };
        const order = await razorpay.orders.create(options);

        // 2. Database Operations
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // A. Find or Create Customer
            let customerId;
            const [existingRows]: any = await connection.execute('SELECT id FROM customers WHERE email = ?', [email]);

            if (existingRows.length > 0) {
                customerId = existingRows[0].id;
                // Update phone/name if missing? For now just use existing ID.
            } else {
                const [res]: any = await connection.execute(
                    'INSERT INTO customers (name, email, phone, source, notes) VALUES (?, ?, ?, ?, ?)',
                    [name, email, phone, source || 'website', `Store Interest: ${store_name || 'N/A'}`]
                );
                customerId = res.insertId;
            }

            // B. Create Order Record
            const [orderRes]: any = await connection.execute(
                'INSERT INTO orders (customer_id, razorpay_order_id, amount, status, source) VALUES (?, ?, ?, ?, ?)',
                [customerId, order.id, amount, 'initiated', source]
            );
            const orderDbId = orderRes.insertId;

            // C. Log Interaction
            await connection.execute(
                'INSERT INTO interactions (customer_id, order_id, type, content) VALUES (?, ?, ?, ?)',
                [customerId, orderDbId, 'system_event', 'Checkout Initiated - Waiting for Payment']
            );

            // D. Track conversion on landing page if source is a slug
            if (source) {
                await connection.execute(
                    'UPDATE landing_pages SET conversions = conversions + 1 WHERE slug = ?',
                    [source]
                ).catch(err => console.log('Landing page not found for source:', source));
            }

            await connection.commit();
        } catch (dbError) {
            await connection.rollback();
            throw dbError; // Re-throw to be caught by outer catch
        } finally {
            connection.release();
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
    }
}

