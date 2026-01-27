
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

    console.log('=== INSPECTING CUSTOMER COMPANY_ID ===');
    try {
        const [rows]: any = await connection.execute(`
            SELECT id, name, email, company_id, company 
            FROM customers 
            LIMIT 20
        `);
        console.table(rows);

        const [nullCounts]: any = await connection.execute(`
            SELECT COUNT(*) as count FROM customers WHERE company_id IS NULL
        `);
        console.log('NULL company_id count:', nullCounts[0].count);

        const [zeroCounts]: any = await connection.execute(`
            SELECT COUNT(*) as count FROM customers WHERE company_id = 0
        `);
        console.log('0 company_id count:', zeroCounts[0].count);

    } catch (e: any) {
        console.error('Error:', e.message);
    }

    connection.end();
}

main().catch(console.error);
