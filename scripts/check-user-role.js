
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkUserRole() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'flipuser',
            password: process.env.DB_PASSWORD || 'flippass123',
            database: process.env.DB_NAME || 'fliphatspro'
        });

        console.log('Connected to database.');

        // 1. Find User "Harshdeep"
        const [users] = await connection.execute('SELECT * FROM users WHERE name LIKE ?', ['%Harshdeep%']);

        if (users.length === 0) {
            console.log('User "Harshdeep" not found.');
            await connection.end();
            return;
        }

        const user = users[0];
        console.log('Found User:', { id: user.id, name: user.name, email: user.email });

        // 2. Get Tenant Roles
        const [roles] = await connection.execute(`
            SELECT tu.tenant_id, tu.user_id, tu.role as legacy_role, tu.role_id, tr.name as role_name, tr.permissions
            FROM tenant_users tu
            LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
            WHERE tu.user_id = ?
        `, [user.id]);

        console.log('Tenant Roles:', JSON.stringify(roles, null, 2));

        await connection.end();

    } catch (error) {
        console.error('Error:', error);
    }
}

checkUserRole();
