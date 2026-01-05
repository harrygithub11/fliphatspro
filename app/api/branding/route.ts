import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Increase body size limit for Base64 images
// Config removed to support Next.js 14 App Router standards
// Large body support is default or handled via runtime config if needed

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Extract fields for logic, but KEEP them in the standard data object for the JSON blob
        const { paymentId, adminEmail, brandName, adminName, adminPhone } = body;

        // Remove only purely technical/transient fields from the JSON we save
        const submissionData = { ...body };
        // optional: delete submissionData.paymentId; 

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Find Order using Payment ID
            const [orderRows]: any = await connection.execute(
                'SELECT id, customer_id FROM orders WHERE razorpay_payment_id = ?',
                [paymentId]
            );

            let orderId = null;
            let customerId = null;

            if (orderRows.length > 0) {
                orderId = orderRows[0].id;
                customerId = orderRows[0].customer_id;

                // 2. Insert Submission
                await connection.execute(
                    'INSERT INTO project_submissions (order_id, brand_name, raw_data_json) VALUES (?, ?, ?)',
                    [orderId, brandName || 'Untitled', JSON.stringify(submissionData)]
                );

                // 3. Update Order Status
                await connection.execute(
                    'UPDATE orders SET status = ?, onboarding_status = ? WHERE id = ?',
                    ['processing', 'completed', orderId]
                );

                // 3. Log Interaction
                // Schema: type (enum), order_id, customer_id, content
                await connection.execute(
                    'INSERT INTO interactions (type, order_id, customer_id, content) VALUES (?, ?, ?, ?)',
                    ['system_event', orderId, customerId, JSON.stringify({ source: 'direct_onboarding', action: 'lead_capture' })]
                );
            } else {
                // Fallback: Create a new Lead/Order if payment ID is missing/invalid
                console.log("Creating new Lead/Order for orphan submission");

                // 2.1 Find or Create Customer
                const email = adminEmail || 'unknown@lead.com';
                const [customerRows]: any = await connection.execute(
                    'SELECT id FROM customers WHERE email = ?',
                    [email]
                );

                if (customerRows.length > 0) {
                    customerId = customerRows[0].id;
                    // Optional: Update phone if missing?
                    if (adminPhone) {
                        await connection.execute('UPDATE customers SET phone = ? WHERE id = ?', [adminPhone, customerId]);
                    }
                } else {
                    const [newCust]: any = await connection.execute(
                        'INSERT INTO customers (name, email, phone, source, stage, score) VALUES (?, ?, ?, ?, ?, ?)',
                        [adminName || brandName || 'New Lead', email, adminPhone || '', 'Onboarding Form', 'new', 'warm']
                    );
                    customerId = newCust.insertId;
                }

                // 2.2 Create Dummy Order
                const dummyPaymentId = `MANUAL_${Date.now()}`;
                // Usage of 'onboarding_pending' status to satisfy ENUM constraint
                const [newOrder]: any = await connection.execute(
                    'INSERT INTO orders (customer_id, razorpay_order_id, razorpay_payment_id, amount, status, currency, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [customerId, `lead_${Date.now()}`, dummyPaymentId, 0, 'onboarding_pending', 'INR']
                );
                orderId = newOrder.insertId;

                // 2.3 Insert Submission
                await connection.execute(
                    'INSERT INTO project_submissions (order_id, brand_name, raw_data_json) VALUES (?, ?, ?)',
                    [orderId, brandName || 'Untitled', JSON.stringify(submissionData)]
                );

                // 2.4 Update Order Status to completed since we have the form
                await connection.execute(
                    'UPDATE orders SET onboarding_status = ?, status = ? WHERE id = ?',
                    ['completed', 'processing', orderId]
                );

                // 2.5 Log Interaction
                // Schema: type (enum), order_id, customer_id, content
                // 3. Log Interaction
                const interContent = { source: 'direct_onboarding', action: 'lead_capture' };
                await connection.execute(
                    'INSERT INTO interactions (type, order_id, customer_id, content) VALUES (?, ?, ?, ?)',
                    ['system_event', orderId, customerId, JSON.stringify(interContent)]
                );

                // 4. Create "Review Onboarding" Task
                // Ensuring the admin dashboard TASKS card is populated
                await connection.execute(
                    'INSERT INTO tasks (title, description, priority, status, related_order_id) VALUES (?, ?, ?, ?, ?)',
                    [
                        `Review Onboarding: ${brandName || 'New Brand'}`,
                        'Verify brand assets, legal details, and product catalog.',
                        'high',
                        'open',
                        orderId
                    ]
                );
            }

            await connection.commit();
            return NextResponse.json({ success: true, message: 'Submission saved' });

        } catch (dbError: any) {
            await connection.rollback();
            console.error('Database Transaction Error:', dbError);

            // Log to file for debugging
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'db_error_log.txt');
            fs.writeFileSync(logPath, `Time: ${new Date().toISOString()}\nError: ${dbError.message}\nStack: ${dbError.stack}\nDetails: ${JSON.stringify(dbError)}\n\n`, { flag: 'a' });

            return NextResponse.json({ success: false, error: dbError.message || 'Database error', details: dbError.sqlMessage }, { status: 500 });
        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Request Processing Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to process request: ' + error.message }, { status: 500 });
    }
}
