
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

    console.log('=== UNASSIGNED CONTACTS PER TENANT ===');
    const [rows]: any = await connection.execute(`
        SELECT tenant_id, COUNT(*) as count 
        FROM customers 
        WHERE (company_id IS NULL OR company_id = 0)
        GROUP BY tenant_id
    `);

    console.table(rows);

    // Also show a few sample IDs and their tenant
    const [samples]: any = await connection.execute(`
         SELECT id, name, tenant_id FROM customers WHERE (company_id IS NULL OR company_id = 0) LIMIT 5
    `);
    console.log('Samples:', samples);

    connection.end();
}

main().catch(console.error);
