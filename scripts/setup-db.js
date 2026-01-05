const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
    console.log("Starting Database Setup...");

    try {
        const connection = await mysql.createConnection(process.env.DATABASE_URL);
        console.log("Connected to Database.");

        // 1. Read Schema
        // 1. Read Schema & Clean Comments
        const schemaPath = path.join(__dirname, '../database_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Remove lines starting with --
        const cleanedSql = schemaSql
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        const statements = cleanedSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // 2. Create Tables
        console.log("Creating Tables...");
        for (const statement of statements) {
            try {
                await connection.query(statement);
            } catch (err) {
                // Ignore "Table already exists" harmless warnings if consistent
                if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
                    console.warn("Schema Warning:", err.message);
                }
            }
        }

        // 3. Create Admin User (if not exists)
        console.log("Creating Admin User...");
        const [admins] = await connection.execute('SELECT * FROM admins WHERE email = ?', ['admin@gmail.com']);
        if (admins.length === 0) {
            await connection.execute(
                'INSERT INTO admins (email, password_hash, role) VALUES (?, ?, ?)',
                ['admin@gmail.com', 'admin123', 'super_admin']
            );
            console.log("Admin user 'admin@gmail.com' created.");
        } else {
            console.log("Admin user already exists.");
        }

        // 4. Seed Customers & Deals (Phase 5 Data)
        console.log("Seeding Customer Data...");
        // Check if data already exists to avoid duplicates
        const [custCheck] = await connection.execute('SELECT count(*) as count FROM customers');
        if (custCheck[0].count === 0) {
            const customers = [
                {
                    name: 'Alice Freeman', email: 'alice@fashion.com', phone: '9876543210',
                    notes: 'High value lead, fashion boutique.', source: 'Instagram Ad', score: 'hot',
                    stage: 'negotiation', tags: JSON.stringify(['ecom', 'shopify-user', 'high-budget']), owner: 'Admin'
                },
                {
                    name: 'Bob Techson', email: 'bob@techstartup.io', phone: '9876543211',
                    notes: 'Interested in SaaS landing page.', source: 'Website', score: 'warm',
                    stage: 'contacted', tags: JSON.stringify(['saas', 'startup']), owner: 'Sales Team'
                },
                {
                    name: 'Charlie Hustle', email: 'charlie@dropship.net', phone: '9876543212',
                    notes: 'Needs urgent delivery.', source: 'Referral', score: 'cold',
                    stage: 'lost', tags: JSON.stringify(['dropshipping']), owner: 'Admin'
                },
                {
                    name: 'Diana Designer', email: 'diana@creative.agency', phone: '9876543213',
                    notes: 'Agency partner potential.', source: 'Manual', score: 'hot',
                    stage: 'won', tags: JSON.stringify(['agency', 'partner']), owner: 'Sales Team'
                }
            ];

            const customerIds = [];
            for (const c of customers) {
                const [res] = await connection.execute(
                    'INSERT INTO customers (name, email, phone, notes, source, score, stage, tags, owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [c.name, c.email, c.phone, c.notes, c.source, c.score, c.stage, c.tags, c.owner]
                );
                customerIds.push(res.insertId);
            }

            // Seed Orders/Deals
            const orders = [
                { cid: customerIds[0], amount: 5000, status: 'paid', rzp: 'order_rzp_1', onboarding: 'completed', payment_mode: 'UPI', proposal_status: 'accepted' },
                { cid: customerIds[0], amount: 15000, status: 'initiated', rzp: 'order_rzp_1b', onboarding: 'pending', payment_mode: null, proposal_status: 'sent' },
                { cid: customerIds[1], amount: 5000, status: 'payment_failed', rzp: 'order_rzp_2', onboarding: 'pending', payment_mode: 'Razorpay', proposal_status: 'draft' },
            ];

            for (const o of orders) {
                await connection.execute(
                    'INSERT INTO orders (customer_id, razorpay_order_id, amount, status, payment_mode, proposal_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [o.cid, o.rzp, o.amount, o.status, o.payment_mode, o.proposal_status]
                );
            }
            console.log("Seed data inserted.");
        } else {
            console.log("Data already seeded.");
        }

        console.log("Database Setup Complete! ✅");
        await connection.end();
        process.exit(0);

    } catch (error) {
        console.error("Setup Failed ❌:", error);
        process.exit(1);
    }
}

setupDatabase();
