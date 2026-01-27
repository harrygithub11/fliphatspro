
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'usernewyear',
    password: process.env.DB_PASSWORD || 'NEWyear11@@',
    database: process.env.DB_NAME || 'newyear',
};

async function main() {
    console.log('Testing getUserTenants logic...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        const email = 'harrymailbox11@gmail.com';

        // 1. Get User ID
        const [users]: any = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('User not found.');
            return;
        }
        const userId = users[0].id;
        console.log('User ID:', userId);

        // 2. Simulate getUserTenants query
        const query = `
            SELECT 
                t.id as tenant_id,
                t.name as tenant_name,
                t.slug as tenant_slug,
                t.plan as tenant_plan,
                tu.role,
                tr.permissions,
                tu.joined_at
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
            WHERE tu.user_id = ? AND t.status = 'active'
            ORDER BY tu.joined_at ASC
        `;

        const [rows]: any = await connection.query(query, [userId]);
        console.log(`Found ${rows.length} tenants via query.`);
        console.log(rows);

        if (rows.length === 0) {
            console.log('WARNING: User has no active tenants linked! This causes login issues.');
        } else {
            console.log('Tenant linkage looks correct.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await connection.end();
    }
}

main();
