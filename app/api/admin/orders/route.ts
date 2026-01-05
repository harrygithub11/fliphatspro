import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const connection = await pool.getConnection();
        try {
            // Join Orders with Customers
            const [rows]: any = await connection.execute(`
                SELECT 
                    o.id, 
                    o.razorpay_order_id, 
                    o.amount, 
                    o.status, 
                    o.onboarding_status, 
                    o.created_at,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
                LIMIT 100
            `);

            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const connection = await pool.getConnection();
        try {
            // Get a random customer
            const [customers]: any = await connection.execute('SELECT id FROM customers ORDER BY RAND() LIMIT 1');

            let customerId;
            if (customers.length === 0) {
                // Create dummy customer if none exist
                const [res]: any = await connection.execute("INSERT INTO customers (name, email) VALUES ('Test User', 'test@example.com')");
                customerId = res.insertId;
            } else {
                customerId = customers[0].id;
            }

            const amount = Math.floor(Math.random() * 10000) + 500;
            const rzpId = `order_${Math.random().toString(36).substring(7)}`;

            await connection.execute(
                'INSERT INTO orders (customer_id, razorpay_order_id, amount, status, currency) VALUES (?, ?, ?, ?, ?)',
                [customerId, rzpId, amount, 'paid', 'INR']
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
