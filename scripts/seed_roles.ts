
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
    console.log('Seeding Default Roles...');
    const connection = await mysql.createConnection(dbConfig);

    try {
        // 1. Get all tenants
        const [tenants]: any = await connection.query('SELECT id, name FROM tenants');
        console.log(`Found ${tenants.length} tenants.`);

        const defaultRoles = [
            {
                name: 'Owner',
                description: 'Full access to everything',
                permissions: JSON.stringify({ all: true })
            },
            {
                name: 'Admin',
                description: 'Administrative access',
                permissions: JSON.stringify({ manage_users: true, manage_billing: true })
            },
            {
                name: 'Member',
                description: 'Standard access',
                permissions: JSON.stringify({ read_only: true })
            }
        ];

        for (const tenant of tenants) {
            console.log(`Seeding roles for tenant: ${tenant.name} (${tenant.id})`);

            for (const role of defaultRoles) {
                try {
                    await connection.query(`
                        INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system)
                        VALUES (?, ?, ?, ?, TRUE)
                    `, [tenant.id, role.name, role.description, role.permissions]);
                } catch (e: any) {
                    if (e.code === 'ER_DUP_ENTRY') {
                        // Ignore duplicates
                    } else {
                        console.error(`Failed to insert role ${role.name} for tenant ${tenant.id}:`, e.message);
                    }
                }
            }
        }

        console.log('Roles seeded successfully.');

        // Verify count
        const [count]: any = await connection.query('SELECT COUNT(*) as count FROM tenant_roles');
        console.log('Total roles now:', count[0].count);

    } catch (e) {
        console.error('Error seeding roles:', e);
    } finally {
        await connection.end();
    }
}

main();
