
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

    console.log('=== COUNTING EMAILS ===');
    const [rows]: any = await connection.execute("SELECT COUNT(*) as count FROM emails");
    console.log(`Total Emails in DB: ${rows[0].count}`);

    if (rows[0].count > 0) {
        const [sample]: any = await connection.execute("SELECT id, subject, tenant_id FROM emails LIMIT 5");
        console.log('Sample Emails:', sample);
    }

    connection.end();
}

main().catch(console.error);
