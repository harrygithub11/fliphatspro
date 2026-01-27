
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

    console.log('=== CHECKING "company" COLUMN ===');
    try {
        await connection.execute("SELECT id, company FROM customers LIMIT 1");
        console.log('✅ Column "company" EXISTS.');
    } catch (e: any) {
        console.error('❌ Column "company" MISSING:', e.message);
    }

    connection.end();
}

main().catch(console.error);
