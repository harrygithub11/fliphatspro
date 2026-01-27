const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found');
    process.exit(1);
}
require('dotenv').config({ path: envPath });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const DEFAULT_ROLES = [
    {
        name: 'Owner',
        description: 'Full access to workspace. Cannot be deleted.',
        is_system: true,
        permissions: {
            contacts: { view: 'all', edit: 'all', delete: 'all', export: true },
            leads: { view: 'all', edit: 'all', delete: 'all', export: true },
            deals: { view: 'all', edit: 'all', delete: 'all' },
            team: { manage: true, invite: true },
            settings: { billing: true, system: true }
        }
    },
    {
        name: 'Admin',
        description: 'Managerial access. Can manage team but not billing.',
        is_system: true,
        permissions: {
            contacts: { view: 'all', edit: 'all', delete: 'all', export: true },
            leads: { view: 'all', edit: 'all', delete: 'all', export: true },
            deals: { view: 'all', edit: 'all', delete: 'all' },
            team: { manage: true, invite: true },
            settings: { billing: false, system: true }
        }
    },
    {
        name: 'Member', // Mapping old 'member' to this interactive role (e.g. Sales Rep)
        description: 'Standard access. Can view and edit owned records.',
        is_system: false,
        permissions: {
            contacts: { view: 'team', edit: 'owned', delete: false, export: false },
            leads: { view: 'team', edit: 'owned', delete: false, export: false },
            deals: { view: 'team', edit: 'owned', delete: false },
            team: { manage: false, invite: false },
            settings: { billing: false, system: false }
        }
    },
    {
        name: 'Viewer',
        description: 'Read-only access to workspace.',
        is_system: false,
        permissions: {
            contacts: { view: 'team', edit: false, delete: false, export: false },
            leads: { view: 'team', edit: false, delete: false, export: false },
            deals: { view: 'team', edit: false, delete: false },
            team: { manage: false, invite: false },
            settings: { billing: false, system: false }
        }
    }
];

async function seedRBAC() {
    console.log('Starting RBAC Seed...');
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Get all tenants
        const [tenants] = await connection.execute('SELECT id, name FROM tenants');
        console.log(`Found ${tenants.length} tenants.`);

        for (const tenant of tenants) {
            console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

            // 2. Ensure default roles exist
            const roleMap = {}; // name -> id

            for (const roleDef of DEFAULT_ROLES) {
                // Check if role exists
                const [existing] = await connection.execute(
                    'SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = ?',
                    [tenant.id, roleDef.name]
                );

                let roleId;
                if (existing.length > 0) {
                    roleId = existing[0].id;
                    // Optional: Update permissions if needed, but skipping to preserve custom changes if any
                } else {
                    const [res] = await connection.execute(
                        `INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [tenant.id, roleDef.name, roleDef.description, JSON.stringify(roleDef.permissions), roleDef.is_system]
                    );
                    roleId = res.insertId;
                    console.log(`  + Created role: ${roleDef.name}`);
                }
                roleMap[roleDef.name.toLowerCase()] = roleId;
            }

            // 3. Migrate existing users
            // Get users in this tenant with NULL role_id
            const [users] = await connection.execute(
                'SELECT id, role FROM tenant_users WHERE tenant_id = ? AND role_id IS NULL',
                [tenant.id]
            );

            if (users.length > 0) {
                console.log(`  Migrating ${users.length} users...`);
                for (const user of users) {
                    // Map old string role to new role ID
                    const roleKey = user.role.toLowerCase(); // owner, admin, member, viewer
                    const newRoleId = roleMap[roleKey] || roleMap['viewer']; // Fallback to viewer if unknown

                    if (newRoleId) {
                        await connection.execute(
                            'UPDATE tenant_users SET role_id = ? WHERE id = ?',
                            [newRoleId, user.id]
                        );
                    } else {
                        console.warn(`    ! Could not map role '${user.role}' for user ${user.id}`);
                    }
                }
            }
        }
        console.log('RBAC Seed completed successfully.');

    } catch (error) {
        console.error('Seed Error:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

seedRBAC();
