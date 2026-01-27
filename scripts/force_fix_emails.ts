
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

    console.log('=== FORCING EMAILS TABLE SCHEMA UPDATE ===');

    // 1. Add tenant_id
    try {
        console.log('Attempting to add tenant_id...');
        await connection.execute(`ALTER TABLE emails ADD COLUMN tenant_id VARCHAR(255) NULL AFTER id`);
        console.log('✅ Added tenant_id');
        await connection.execute(`ALTER TABLE emails ADD INDEX idx_tenant (tenant_id)`);
        console.log('✅ Added idx_tenant');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ tenant_id already exists');
        } else {
            console.error('❌ Failed to add tenant_id:', e.message);
        }
    }

    // 2. Add smtp_account_id if missing (was integer in fix_emails_table.ts)
    // Actually, let's just make sure tenant_id is there. 

    // 3. Verify columns
    try {
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM emails");
        console.log('FINAL COLUMNS:', JSON.stringify(columns.map((c: any) => c.Field), null, 2));
    } catch (e) {
        console.error('Failed to show columns');
    }

    connection.end();
}

main().catch(console.error);
