
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

    console.log('=== INSPECTING SMTP_ACCOUNTS CONTENT ===');
    const [rows]: any = await connection.execute("SELECT id, name, from_email, tenant_id, imap_secure, smtp_secure FROM smtp_accounts");
    console.table(rows);

    connection.end();
}

main().catch(console.error);
