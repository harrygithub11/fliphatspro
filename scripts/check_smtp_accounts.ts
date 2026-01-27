
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Checking smtp_accounts table...');
    // Select all to see if any exist, and their ownership
    const [rows]: any = await connection.execute('SELECT id, name, from_email, tenant_id, created_by FROM smtp_accounts');
    console.log(`Found ${rows.length} accounts:`);
    console.table(rows);

    connection.end();
}

main().catch(console.error);
