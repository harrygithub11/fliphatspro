
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

    console.log('=== CHECKING TENANT IDS FOR UNASSIGNED CUSTOMERS ===');

    // Group unassigned customers by tenant_id
    const [rows]: any = await connection.execute(`
        SELECT tenant_id, COUNT(*) as count 
        FROM customers 
        WHERE company_id IS NULL
        GROUP BY tenant_id
    `);

    console.table(rows);

    // Also check what tenant_id the user is likely using (from a known admin/user)
    // Assuming 'admin' is one of them or we can just list all tenants
    const [tenants]: any = await connection.execute("SELECT id, name FROM tenants");
    console.log('\n--- Tenants ---');
    console.table(tenants);

    connection.end();
}

main().catch(console.error);
