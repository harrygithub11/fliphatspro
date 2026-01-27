
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

        // 1. Find Harshdeep
        const [users]: any = await connection.execute("SELECT * FROM users WHERE name LIKE '%harshdeep%' OR email LIKE '%harshdeep%'");
        if (users.length === 0) {
            console.log('User "Harshdeep" not found!');
            return;
        }
        const user = users[0];
        console.log('Found User:', user.id, user.name, user.email);

        // 2. Find Tenant for User
        const [tus]: any = await connection.execute('SELECT tenant_id FROM tenant_users WHERE user_id = ? LIMIT 1', [user.id]);
        if (tus.length === 0) {
            console.log('User has no tenant!');
            return;
        }
        const tenantId = tus[0].tenant_id;
        console.log('Tenant:', tenantId);

        // 3. Find Owner Role ID
        const [roles]: any = await connection.execute("SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = 'Owner'", [tenantId]);
        let ownerRoleId = roles.length > 0 ? roles[0].id : 1; // Fallback to 1 if not found (we previously fixed ID 1)

        // 4. Update User Role
        await connection.execute(
            `UPDATE tenant_users SET role = 'owner', role_id = ? WHERE user_id = ? AND tenant_id = ?`,
            [ownerRoleId, user.id, tenantId]
        );
        console.log(`Updated User ${user.name} to Owner (RoleID: ${ownerRoleId}).`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

fix();
