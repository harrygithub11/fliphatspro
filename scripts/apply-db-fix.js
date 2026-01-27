const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function runFix() {
    const pool = mysql.createPool({
        host: '127.0.0.1',
        port: 3306,
        user: 'root',
        password: '', // Assuming no password based on previous logs
        database: 'dbfliphats',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        console.log('--- Starting Database Fix ---');

        // 1. Create login_history table
        console.log('1. Creating login_history table...');
        const sqlPath = path.join(__dirname, 'fix-login-history.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('   Done.');

        // 2. Fix missing subscriptions for existing tenants
        console.log('2. checking for tenants without subscriptions...');
        const [tenants] = await pool.query('SELECT id, plan FROM tenants');

        for (const tenant of tenants) {
            const [subs] = await pool.execute('SELECT 1 FROM subscriptions WHERE company_id = ?', [tenant.id]);
            if (subs.length === 0) {
                console.log(`   Fixing tenant: ${tenant.id}`);
                await pool.execute(
                    `INSERT INTO subscriptions (id, company_id, plan, status, start_date, created_at, updated_at)
                     VALUES (?, ?, ?, 'active', NOW(), NOW(), NOW())`,
                    [crypto.randomUUID(), tenant.id, tenant.plan || 'free']
                );
            }
        }
        console.log('   All tenants verified.');

        console.log('--- Fixes Applied Successfully ---');
    } catch (error) {
        console.error('Error applying fixes:', error);
    } finally {
        await pool.end();
    }
}

runFix();
