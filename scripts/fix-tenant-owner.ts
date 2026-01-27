
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    try {
        console.log('--- FIXING MISSING OWNER IDs ---');

        // 1. Find tenants with missing owner_id
        const [tenants]: any = await connection.execute('SELECT id, name FROM tenants WHERE owner_id IS NULL');

        if (tenants.length === 0) {
            console.log('No tenants with missing owner_id found.');
            return;
        }

        console.log(`Found ${tenants.length} tenants with missing owner_id.`);

        for (const tenant of tenants) {
            console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

            // 2. Find the "owner" user for this tenant
            let [users]: any = await connection.execute(
                `SELECT user_id FROM tenant_users WHERE tenant_id = ? AND role = 'owner' ORDER BY joined_at ASC LIMIT 1`,
                [tenant.id]
            );

            // If no owner, try admin, then member
            if (users.length === 0) {
                [users] = await connection.execute(
                    `SELECT user_id FROM tenant_users WHERE tenant_id = ? ORDER BY joined_at ASC LIMIT 1`,
                    [tenant.id]
                );
            }

            if (users.length > 0) {
                const newOwnerId = users[0].user_id;
                console.log(` -> Assigning Owner ID: ${newOwnerId}`);

                await connection.execute(
                    'UPDATE tenants SET owner_id = ? WHERE id = ?',
                    [newOwnerId, tenant.id]
                );
                console.log(' -> Updated.');
            } else {
                console.log(' -> No users found for this tenant. Skipping.');
            }
        }

        console.log('Fix complete.');

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
