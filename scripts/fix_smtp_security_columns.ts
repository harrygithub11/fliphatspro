
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

    console.log('=== FIXING SMTP_ACCOUNTS SECURITY COLUMNS ===');

    // 1. Add imap_secure
    try {
        console.log('Attempting to add imap_secure...');
        await connection.execute(`ALTER TABLE smtp_accounts ADD COLUMN imap_secure TINYINT(1) DEFAULT 1 AFTER imap_port`);
        console.log('✅ Added imap_secure');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ imap_secure already exists');
        } else {
            console.error('❌ Failed to add imap_secure:', e.message);
        }
    }

    // 2. Add smtp_secure
    try {
        console.log('Attempting to add smtp_secure...');
        await connection.execute(`ALTER TABLE smtp_accounts ADD COLUMN smtp_secure TINYINT(1) DEFAULT 1 AFTER port`);
        console.log('✅ Added smtp_secure');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ smtp_secure already exists');
        } else {
            console.error('❌ Failed to add smtp_secure:', e.message);
        }
    }

    // 3. Verify columns
    try {
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM smtp_accounts");
        console.log('FINAL COLUMNS:', JSON.stringify(columns.map((c: any) => c.Field), null, 2));
    } catch (e) {
        console.error('Failed to show columns');
    }

    connection.end();
}

main().catch(console.error);
