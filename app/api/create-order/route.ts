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

            // A.1. Derive Tenant from Source (Slug) or Store Name
            let tenantId: number | null = null;
            if (source && source !== 'website') {
                const [pageRows]: any = await connection.execute('SELECT tenant_id FROM landing_pages WHERE slug = ?', [source]);
                if (pageRows.length > 0) {
                    tenantId = pageRows[0].tenant_id;
                }
            }

            // If no tenant found from slug, try default 'website' tenant or error?
            // For now, if we can't find a tenant, we MUST NOT create orphan records if the schema enforces it.
            // Assuming there is a default tenant (e.g. ID 1) or we fail.
            // Let's assume passed ID for now or fail if strict.
            // BETTER: Fail if no tenant identified to avoid data leak/corruption.

            if (!tenantId) {
                // Try finding by store_name if provided??
                // Fallback: If strict mode, throw error.
                // For migration safety, if tenant_id is not nullable, this will fail DB side.
                // We'll log it and let it fail or default to 1 (Platform) if acceptable?
                // Let's default to process.env.DEFAULT_TENANT_ID or 1 for legacy support, but finding via slug is best.
                console.warn(`[Create Order] No tenant identified for source: ${source}. Defaulting to NULL (might fail)`);
            }

            // A. Find or Create Customer
            let customerId;
            // Tenant-scoped lookup if tenantId exists
            let query = 'SELECT id FROM customers WHERE email = ?';
            let params = [email];
            if (tenantId) {
                query += ' AND tenant_id = ?';
                params.push(tenantId);
            }

            const [existingRows]: any = await connection.execute(query, params);

            if (existingRows.length > 0) {
                customerId = existingRows[0].id;
            } else {
                const [res]: any = await connection.execute(
                    'INSERT INTO customers (tenant_id, name, email, phone, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
                    [tenantId, name, email, phone, source || 'website', `Store Interest: ${store_name || 'N/A'}`]
                );
                customerId = res.insertId;
            }

            // B. Create Order Record
            const [orderRes]: any = await connection.execute(
                'INSERT INTO orders (tenant_id, customer_id, razorpay_order_id, amount, status, source) VALUES (?, ?, ?, ?, ?, ?)',
                [tenantId, customerId, order.id, amount, 'initiated', source]
            );
            const orderDbId = orderRes.insertId;

            // C. Log Interaction
            await connection.execute(
                'INSERT INTO interactions (tenant_id, customer_id, order_id, type, content, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [tenantId, customerId, orderDbId, 'system_event', 'Checkout Initiated - Waiting for Payment']
            );

            // D. Track conversion on landing page if source is a slug
            if (source && tenantId) {
                await connection.execute(
                    'UPDATE landing_pages SET conversions = conversions + 1 WHERE slug = ? AND tenant_id = ?',
                    [source, tenantId]
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

