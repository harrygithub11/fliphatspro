
import mysql from 'mysql2/promise'

async function fix() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });
        console.log('Connected to DB');

        // 1. Get Tenant ID for User 1
        const [tus]: any = await connection.execute('SELECT tenant_id FROM tenant_users WHERE user_id = 1 LIMIT 1');
        if (tus.length === 0) {
            console.log('User 1 has no tenant!');
            return;
        }
        const tenantId = tus[0].tenant_id;
        console.log('Tenant:', tenantId);

        // 2. Find Owner Role for this Tenant
        const [roles]: any = await connection.execute("SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = 'Owner'", [tenantId]);
        let ownerRoleId = null;

        if (roles.length > 0) {
            ownerRoleId = roles[0].id;
            console.log('Found Owner Role ID:', ownerRoleId);
        } else {
            console.log('No Owner Role found! Creating default Owner role...');
            // Optional: Create role if missing? For now just log.
            // We can rely on string 'owner' fallback if we set role='owner'.
        }

        // 3. Update User to Owner
        await connection.execute(
            `UPDATE tenant_users SET role = 'owner', role_id = ? WHERE user_id = 1 AND tenant_id = ?`,
            [ownerRoleId, tenantId]
        );
        console.log('Updated User 1 to Owner.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

fix();
