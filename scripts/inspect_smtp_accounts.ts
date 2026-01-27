
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

    console.log('=== INSPECTING SMTP_ACCOUNTS TABLE ===');
    try {
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM smtp_accounts");
        console.table(columns);
    } catch (e: any) {
        console.error('Error showing columns:', e.message);
    }

    connection.end();
}

main().catch(console.error);
