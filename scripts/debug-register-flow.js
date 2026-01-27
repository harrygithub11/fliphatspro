
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
require('dotenv').config();

const cleanSlug = (name) => name.toLowerCase().replace(/[^a-z0-0]+/g, '-').replace(/(^-|-$)/g, '');

async function run() {
    console.log('🔍 Debugging Registration Flow (with manual UUID)...');

    // Test Data
    const name = 'Debug User UUID';
    const email = `debug_${Date.now()}@example.com`;
    const password = 'password123';
    const companyName = `Debug Corp UUID ${Date.now()}`;

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'flipuser',
        password: process.env.DB_PASSWORD || 'flippass123',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log('✅ Connected.');

        await connection.beginTransaction();

        try {
            // User (Auto Increment)
            const hashedPassword = await bcrypt.hash(password, 10);
            const [uRes] = await connection.execute(
                'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
                [name, email, hashedPassword]
            );
            console.log('INSERT User ID:', uRes.insertId);

            // Tenant (Manual UUID)
            const tenantId = randomUUID(); // Generate UUID
            const slug = `${cleanSlug(companyName)}-${Date.now()}`;

            console.log('Generated Tenant UUID:', tenantId);

            await connection.execute(
                'INSERT INTO tenants (id, name, slug, plan, status) VALUES (?, ?, ?, ?, ?)',
                [tenantId, companyName, slug, 'starter', 'active']
            );
            console.log('INSERT Tenant Success.');

            // Link
            await connection.execute(
                'INSERT INTO tenant_users (tenant_id, user_id, role) VALUES (?, ?, ?)',
                [tenantId, uRes.insertId, 'owner']
            );
            console.log('LINKED User to Tenant.');

            await connection.rollback();
            console.log('✅ Registration Logic: OK (Rolled back test data)');

        } catch (err) {
            await connection.rollback();
            console.error('❌ Transaction Logic Failed:', err.message);
            console.error(err);
        }

    } catch (error) {
        console.error('❌ Connection Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
