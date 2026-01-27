
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

    console.log('--- START RAW DUMP ---');
    const [rows]: any = await connection.execute("SHOW CREATE TABLE user_presence");
    console.log(rows[0]['Create Table']);
    console.log('--- END RAW DUMP ---');

    connection.end();
}

main().catch(console.error);
