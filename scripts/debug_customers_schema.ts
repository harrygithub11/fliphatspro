
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== INSPECTING CUSTOMERS TABLE ===');
    try {
        const [rows]: any = await connection.execute("SHOW CREATE TABLE customers");
        console.log(rows[0]['Create Table']);
    } catch (e: any) {
        console.error('Error:', e.message);
    }

    connection.end();
}

main().catch(console.error);
