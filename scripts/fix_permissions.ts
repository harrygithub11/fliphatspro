import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';

    console.log('=== Fixing Tenant Role Permissions ===');

    // Default permissions for each role
    const ownerPermissions = JSON.stringify({
        "*": true,  // Full access
        "admin": true,
        "companies": { "read": true, "write": true, "delete": true },
        "leads": { "read": true, "write": true, "delete": true },
        "deals": { "read": true, "write": true, "delete": true },
        "email": { "read": true, "write": true, "delete": true },
        "campaigns": { "read": true, "write": true, "delete": true },
        "settings": { "read": true, "write": true },
        "team": { "read": true, "write": true, "delete": true, "invite": true },
        "billing": { "read": true, "write": true }
    });

    const adminPermissions = JSON.stringify({
        "companies": { "read": true, "write": true, "delete": true },
        "leads": { "read": true, "write": true, "delete": true },
        "deals": { "read": true, "write": true, "delete": true },
        "email": { "read": true, "write": true, "delete": true },
        "campaigns": { "read": true, "write": true, "delete": true },
        "settings": { "read": true, "write": true },
        "team": { "read": true, "write": true, "invite": true }
    });

    const memberPermissions = JSON.stringify({
        "companies": { "read": true, "write": true },
        "leads": { "read": true, "write": true },
        "deals": { "read": true, "write": true },
        "email": { "read": true, "write": true },
        "campaigns": { "read": true }
    });

    const viewerPermissions = JSON.stringify({
        "companies": { "read": true },
        "leads": { "read": true },
        "deals": { "read": true },
        "email": { "read": true },
        "campaigns": { "read": true }
    });

    // Create role definitions
    const roles = [
        { name: 'owner', description: 'Full tenant owner with all permissions', permissions: ownerPermissions, isSystem: true },
        { name: 'admin', description: 'Administrator with most permissions', permissions: adminPermissions, isSystem: true },
        { name: 'member', description: 'Regular team member', permissions: memberPermissions, isSystem: true },
        { name: 'viewer', description: 'Read-only access', permissions: viewerPermissions, isSystem: true }
    ];

    for (const role of roles) {
        console.log(`Creating role: ${role.name}...`);
        await c.execute(`
            INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE permissions = ?, description = ?
        `, [tenantId, role.name, role.description, role.permissions, role.isSystem, role.permissions, role.description]);
    }

    // Get the owner role ID
    const [ownerRoles]: any = await c.execute(
        `SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = 'owner'`, [tenantId]
    );
    const ownerRoleId = ownerRoles[0]?.id;
    console.log('Owner Role ID:', ownerRoleId);

    // Update tenant_users to link to the role definition
    if (ownerRoleId) {
        console.log('Linking user to owner role...');
        await c.execute(`
            UPDATE tenant_users SET role_id = ? WHERE tenant_id = ? AND role = 'owner'
        `, [ownerRoleId, tenantId]);
    }

    console.log('');
    console.log('✅ Tenant role permissions fixed!');

    c.end();
}

main().catch(console.error);
