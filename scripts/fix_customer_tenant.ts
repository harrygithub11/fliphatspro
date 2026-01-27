
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // Get the Fliphats company tenant
    const [companies]: any = await connection.execute(
        `SELECT id, name, tenant_id FROM companies WHERE name LIKE '%Fliphats%' LIMIT 1`
    );

    if (companies.length === 0) {
        console.log('No Fliphats company found!');
        connection.end();
        return;
    }

    const targetTenant = companies[0].tenant_id;
    console.log('Target Tenant ID:', targetTenant);

    // Check unassigned customers for this tenant
    const [unassigned]: any = await connection.execute(
        `SELECT COUNT(*) as cnt FROM customers WHERE tenant_id = ? AND (company_id IS NULL OR company_id = 0)`,
        [targetTenant]
    );
    console.log('Unassigned customers for this tenant:', unassigned[0].cnt);

    // Check ALL unassigned customers (any tenant)
    const [allUnassigned]: any = await connection.execute(
        `SELECT tenant_id, COUNT(*) as cnt FROM customers WHERE (company_id IS NULL OR company_id = 0) GROUP BY tenant_id`
    );
    console.log('Unassigned customers by tenant:');
    console.table(allUnassigned);

    // If there are unassigned customers in OTHER tenants, migrate them
    if (unassigned[0].cnt === 0 && allUnassigned.length > 0) {
        console.log('\n=== MIGRATING CUSTOMERS TO TARGET TENANT ===');
        const [result]: any = await connection.execute(
            `UPDATE customers SET tenant_id = ? WHERE (company_id IS NULL OR company_id = 0) AND tenant_id != ?`,
            [targetTenant, targetTenant]
        );
        console.log('Migrated', result.affectedRows, 'customers to target tenant');
    }

    connection.end();
}

main().catch(console.error);
