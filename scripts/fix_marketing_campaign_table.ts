
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

    console.log('=== FIXING MARKETING_CAMPAIGN TABLE ===');

    // 1. Add created_by
    try {
        console.log('Attempting to add created_by...');
        await connection.execute(`ALTER TABLE marketing_campaign ADD COLUMN created_by INT NULL AFTER accountId`);
        console.log('✅ Added created_by');
        await connection.execute(`ALTER TABLE marketing_campaign ADD INDEX idx_created_by (created_by)`);
        console.log('✅ Added idx_created_by');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ created_by already exists');
        } else {
            console.error('❌ Failed to add created_by:', e.message);
        }
    }

    // 2. Add tenant_id if missing (just in case)
    try {
        console.log('Attempting to check/add tenant_id...');
        await connection.execute(`ALTER TABLE marketing_campaign ADD COLUMN tenant_id VARCHAR(255) NULL AFTER id`);
        console.log('✅ Added tenant_id');
        await connection.execute(`ALTER TABLE marketing_campaign ADD INDEX idx_tenant (tenant_id)`);
        console.log('✅ Added idx_tenant');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ tenant_id already exists');
        } else {
            console.error('❌ Failed to add tenant_id:', e.message);
        }
    }

    // 3. Verify columns
    try {
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM marketing_campaign");
        console.log('FINAL COLUMNS:', JSON.stringify(columns.map((c: any) => c.Field), null, 2));
    } catch (e) {
        console.error('Failed to show columns');
    }

    connection.end();
}

main().catch(console.error);
