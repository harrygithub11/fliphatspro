
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

    const ACTIVE_TENANT_ID = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    console.log(`=== CHECKING DATA FOR TENANT: ${ACTIVE_TENANT_ID} ===`);

    // Check Accounts
    const [accounts]: any = await connection.execute("SELECT id, from_email, tenant_id FROM smtp_accounts WHERE tenant_id = ?", [ACTIVE_TENANT_ID]);
    console.log(`Found ${accounts.length} smtp_accounts.`);
    if (accounts.length > 0) console.table(accounts);

    // Check Emails
    const [emails]: any = await connection.execute("SELECT id, subject, tenant_id FROM emails WHERE tenant_id = ?", [ACTIVE_TENANT_ID]);
    console.log(`Found ${emails.length} emails.`);
    if (emails.length > 0) console.table(emails.slice(0, 5));

    connection.end();
}

main().catch(console.error);
