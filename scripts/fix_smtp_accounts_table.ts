
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

    console.log('=== FIXING SMTP_ACCOUNTS TABLE ===');

    try {
        // Check if tenant_id exists
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM smtp_accounts LIKE 'tenant_id'");

        if (columns.length === 0) {
            console.log('Adding tenant_id and created_by columns...');
            await connection.execute(`
                ALTER TABLE smtp_accounts
                ADD COLUMN tenant_id VARCHAR(255) NULL AFTER id,
                ADD COLUMN created_by INT NULL AFTER tenant_id,
                ADD INDEX idx_tenant (tenant_id),
                ADD INDEX idx_created_by (created_by);
            `);
            console.log('✅ Columns added successfully.');
        } else {
            console.log('ℹ️ Columns already exist.');
        }

    } catch (e: any) {
        console.error('Error modifying table:', e.message);
    }

    connection.end();
}

main().catch(console.error);
