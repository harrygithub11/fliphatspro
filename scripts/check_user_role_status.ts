
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
    console.log('Checking User Role Status...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        const email = 'harrymailbox11@gmail.com'; // The user trying to login

        // 1. Get User ID from email (assuming users table or similar, adjusting query based on typical auth)
        // Adjusting to look in tenant_users directly via join with users if needed, or just inspecting tenant_users
        // First finding the user in the main 'users' table if it exists, or assuming fetch via email in tenant_users context?
        // Let's check `users` table first.

        console.log(`Looking up user: ${email}`);
        const [users]: any = await connection.query('SELECT id, email, name FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log('User not found in `users` table.');
            return;
        }

        const user = users[0];
        console.log('Found User:', user);

        // 2. Check tenant_users for this user
        const [tenantUsers]: any = await connection.query(`
            SELECT tu.*, t.name as tenant_name, tr.name as role_name 
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
            WHERE tu.user_id = ?
        `, [user.id]);

        console.log(`Found ${tenantUsers.length} tenant associations:`);
        tenantUsers.forEach((tu: any) => {
            console.log(`- Tenant: ${tu.tenant_name} (${tu.tenant_id})`);
            console.log(`  Role ID: ${tu.role_id}`);
            console.log(`  Role Name: ${tu.role_name || 'NULL (Missing Role)'}`);
        });

    } catch (e) {
        console.error('Error checking user:', e);
    } finally {
        await connection.end();
    }
}

main();
