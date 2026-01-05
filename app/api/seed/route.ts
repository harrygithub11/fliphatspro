import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Clear existing data (optional, but good for clean slate)
            // await connection.execute('DELETE FROM tasks');
            // await connection.execute('DELETE FROM interactions');
            // await connection.execute('DELETE FROM project_submissions');
            // await connection.execute('DELETE FROM orders');
            // await connection.execute('DELETE FROM customers');

            // 2. Insert Customers
            const customers = [
                {
                    name: 'Alice Freeman',
                    email: 'alice@fashion.com',
                    phone: '9876543210',
                    notes: 'High value lead, fashion boutique.',
                    source: 'Instagram Ad',
                    score: 'hot',
                    stage: 'negotiation',
                    tags: JSON.stringify(['ecom', 'shopify-user', 'high-budget']),
                    owner: 'Admin'
                },
                {
                    name: 'Bob Techson',
                    email: 'bob@techstartup.io',
                    phone: '9876543211',
                    notes: 'Interested in SaaS landing page.',
                    source: 'Website',
                    score: 'warm',
                    stage: 'contacted',
                    tags: JSON.stringify(['saas', 'startup']),
                    owner: 'Sales Team'
                },
                {
                    name: 'Charlie Hustle',
                    email: 'charlie@dropship.net',
                    phone: '9876543212',
                    notes: 'Needs urgent delivery.',
                    source: 'Referral',
                    score: 'cold',
                    stage: 'lost',
                    tags: JSON.stringify(['dropshipping']),
                    owner: 'Admin'
                },
                {
                    name: 'Diana Designer',
                    email: 'diana@creative.agency',
                    phone: '9876543213',
                    notes: 'Agency partner potential.',
                    source: 'Manual',
                    score: 'hot',
                    stage: 'won',
                    tags: JSON.stringify(['agency', 'partner']),
                    owner: 'Sales Team'
                }
            ];

            const customerIds = [];
            for (const c of customers) {
                const [res]: any = await connection.execute(
                    'INSERT INTO customers (name, email, phone, notes, source, score, stage, tags, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [c.name, c.email, c.phone, c.notes, c.source, c.score, c.stage, c.tags, c.owner]
                );
                customerIds.push(res.insertId);
            }

            // 3. Insert Orders (Deals)
            const orders = [
                { cid: customerIds[0], amount: 5000, status: 'paid', rzp: 'order_rzp_1', onboarding: 'completed', payment_mode: 'UPI', proposal_status: 'accepted' },
                { cid: customerIds[0], amount: 15000, status: 'initiated', rzp: 'order_rzp_1b', onboarding: 'pending', payment_mode: null, proposal_status: 'sent' }, // Alice 2nd deal
                { cid: customerIds[1], amount: 5000, status: 'payment_failed', rzp: 'order_rzp_2', onboarding: 'pending', payment_mode: 'Razorpay', proposal_status: 'draft' },
                { cid: customerIds[2], amount: 5000, status: 'initiated', rzp: 'order_rzp_3', onboarding: 'pending', payment_mode: null, proposal_status: 'draft' },
                { cid: customerIds[3], amount: 15000, status: 'delivered', rzp: 'order_rzp_4', onboarding: 'completed', payment_mode: 'Bank Transfer', proposal_status: 'accepted' }
            ];

            const orderIds = [];
            for (const o of orders) {
                const [res]: any = await connection.execute(
                    'INSERT INTO orders (customer_id, razorpay_order_id, amount, status, onboarding_status, payment_mode, proposal_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [o.cid, o.rzp, o.amount, o.status, o.onboarding, o.payment_mode, o.proposal_status]
                );
                orderIds.push(res.insertId);
            }

            // 4. Insert Submissions (For Alice & Diana)
            await connection.execute(
                'INSERT INTO project_submissions (order_id, brand_name, raw_data_json) VALUES (?, ?, ?)',
                [orderIds[0], 'Alice Boutique', JSON.stringify({ color: 'Pink', style: 'Modern', ref: 'zara.com' })]
            );
            await connection.execute(
                'INSERT INTO project_submissions (order_id, brand_name, raw_data_json) VALUES (?, ?, ?)',
                [orderIds[3], 'Creative Agency X', JSON.stringify({ color: 'Black/White', style: 'Minimal', ref: 'apple.com' })]
            );

            // 5. Insert Interactions
            await connection.execute('INSERT INTO interactions (customer_id, order_id, type, content, sentiment) VALUES (?, ?, ?, ?, ?)',
                [customerIds[0], orderIds[0], 'call_log', 'Discussed pink color scheme. Client is happy.', 'positive']);
            await connection.execute('INSERT INTO interactions (customer_id, order_id, type, content, sentiment) VALUES (?, ?, ?, ?, ?)',
                [customerIds[1], orderIds[1], 'system_event', 'Payment Failed at checkout.', 'negative']);

            // 6. Insert Tasks
            await connection.execute('INSERT INTO tasks (related_order_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)',
                [orderIds[0], 'Setup Server for Alice', 'Deploy Vultr instance.', 'high', 'open']);
            await connection.execute('INSERT INTO tasks (related_order_id, title, description, priority, status) VALUES (?, ?, ?, ?, ?)',
                [orderIds[2], 'Follow up with Charlie', 'He abandoned cart.', 'medium', 'open']);

            await connection.commit();
            return NextResponse.json({ success: true, message: 'Seeded successfully' });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Seed Error:", error);
        return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
    }
}
