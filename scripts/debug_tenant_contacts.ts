
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

    // 1. Get the "Fliphats" company and its tenant
    console.log('=== FLIPHATS COMPANY TENANT ===');
    const [company]: any = await connection.execute(`
        SELECT id, name, tenant_id FROM companies WHERE name LIKE '%Fliphats%' LIMIT 1
    `);
    console.table(company);
    const companyTenantId = company[0]?.tenant_id;
    console.log('Company Tenant ID:', companyTenantId);

    // 2. Count unassigned contacts for THIS tenant
    console.log('\n=== UNASSIGNED CONTACTS FOR THIS TENANT ===');
    const [unassignedForTenant]: any = await connection.execute(`
        SELECT COUNT(*) as count FROM customers 
        WHERE tenant_id = ? AND (company_id IS NULL OR company_id = 0)
    `, [companyTenantId]);
    console.log('Unassigned contacts for tenant:', unassignedForTenant[0].count);

    // 3. Show sample contacts for this tenant
    console.log('\n=== SAMPLE CONTACTS FOR THIS TENANT ===');
    const [samples]: any = await connection.execute(`
        SELECT id, name, email, company_id FROM customers 
        WHERE tenant_id = ? LIMIT 10
    `, [companyTenantId]);
    console.table(samples);

    connection.end();
}

main().catch(console.error);
