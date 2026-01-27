import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const output: any = {};

    // Get the Fliphats company tenant
    const [companies]: any = await connection.execute(
        `SELECT id, name, tenant_id FROM companies WHERE name LIKE '%Fliphats%' LIMIT 1`
    );
    output.fliphatsCompany = companies[0] || null;

    const targetTenant = companies[0]?.tenant_id;
    output.targetTenant = targetTenant;

    // Check unassigned customers for this tenant
    const [unassigned]: any = await connection.execute(
        `SELECT COUNT(*) as cnt FROM customers WHERE tenant_id = ? AND (company_id IS NULL OR company_id = 0)`,
        [targetTenant]
    );
    output.unassignedForThisTenant = unassigned[0].cnt;

    // Check ALL unassigned customers (any tenant)
    const [allUnassigned]: any = await connection.execute(
        `SELECT tenant_id, COUNT(*) as cnt FROM customers WHERE (company_id IS NULL OR company_id = 0) GROUP BY tenant_id`
    );
    output.unassignedByTenant = allUnassigned;

    fs.writeFileSync('tenant_debug_output.json', JSON.stringify(output, null, 2));
    console.log('Output written to tenant_debug_output.json');

    connection.end();
}

main().catch(console.error);
