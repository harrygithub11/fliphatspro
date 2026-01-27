
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
        // 1. Get all Admins
        const [admins]: any = await connection.execute('SELECT * FROM admins');
        console.log(`Found ${admins.length} legacy admins.`);

        // 2. Get main tenant
        const [tenants]: any = await connection.execute("SELECT id FROM tenants WHERE slug = 'fliphats'");
        const mainTenantId = tenants[0]?.id;

        if (!mainTenantId) {
            console.error('Main tenant not found!');
            return;
        }

        for (const admin of admins) {
            console.log(`Processing admin: ${admin.email}`);

            // Check if user exists
            const [users]: any = await connection.execute('SELECT * FROM users WHERE email = ?', [admin.email]);

            let userId;

            if (users.length > 0) {
                console.log(` -> User already exists (ID: ${users[0].id})`);
                userId = users[0].id;
            } else {
                console.log(` -> Creating new user...`);
                const [result]: any = await connection.execute(
                    `INSERT INTO users (email, password_hash, name, avatar_url, phone, language, timezone, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        admin.email,
                        admin.password_hash,
                        admin.name,
                        admin.avatar_url,
                        admin.phone,
                        admin.language || 'en',
                        admin.timezone || 'UTC',
                        admin.created_at || new Date()
                    ]
                );
                userId = result.insertId;
                console.log(` -> Created User ID: ${userId}`);
            }

            // Ensure Tenant Membership
            const [membership]: any = await connection.execute(
                'SELECT * FROM tenant_users WHERE tenant_id = ? AND user_id = ?',
                [mainTenantId, userId]
            );

            if (membership.length === 0) {
                console.log(` -> Adding to tenant ${mainTenantId} as OWNER`);
                await connection.execute(
                    `INSERT INTO tenant_users (tenant_id, user_id, role, joined_at) VALUES (?, ?, 'owner', NOW())`,
                    [mainTenantId, userId]
                );
            } else {
                console.log(` -> Already a member of tenant.`);
            }
        }

        console.log('Migration complete.');

    } catch (e: any) {
        console.error('Migration failed:', e.message);
    } finally {
        connection.end();
    }
}

main();
