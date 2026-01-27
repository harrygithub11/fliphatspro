
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

    console.log('=== LISTING COMPANIES ===');
    const [companies]: any = await connection.execute("SELECT id, name, tenant_id FROM companies LIMIT 20");
    console.table(companies);

    const [tenants]: any = await connection.execute("SELECT id, name FROM tenants");
    console.table(tenants);

    connection.end();
}

main().catch(console.error);
