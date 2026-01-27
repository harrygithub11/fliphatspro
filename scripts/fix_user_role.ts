
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
    console.log('Fixing User Role...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        const email = 'harrymailbox11@gmail.com';

        // 1. Get User
        const [users]: any = await connection.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            console.log('User not found.');
            return;
        }
        const user = users[0];
        console.log('Found User ID:', user.id);

        // 2. Find Owner Role ID for the user's tenant(s)
        const [tenantAssociations]: any = await connection.query('SELECT tenant_id FROM tenant_users WHERE user_id = ?', [user.id]);

        for (const assoc of tenantAssociations) {
            console.log(`Processing tenant: ${assoc.tenant_id}`);

            // Find Owner role for this tenant
            const [roles]: any = await connection.query('SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = "Owner"', [assoc.tenant_id]);

            if (roles.length > 0) {
                const ownerRoleId = roles[0].id;
                console.log(`Found Owner Role ID: ${ownerRoleId}`);

                // Update tenant_users
                await connection.query('UPDATE tenant_users SET role_id = ? WHERE user_id = ? AND tenant_id = ?', [ownerRoleId, user.id, assoc.tenant_id]);
                console.log('Updated role to Owner.');
            } else {
                console.log('No Owner role found for this tenant (try running seed_roles.ts again if needed).');
            }
        }

    } catch (e) {
        console.error('Error fixing role:', e);
    } finally {
        await connection.end();
    }
}

main();
