
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

    console.log('=== FIXING CUSTOMERS TABLE ===');

    // Add company_id
    try {
        console.log('Attempting to add company_id...');
        await connection.execute(`ALTER TABLE customers ADD COLUMN company_id INT NULL AFTER tenant_id`);
        console.log('✅ Added company_id');
        await connection.execute(`ALTER TABLE customers ADD INDEX idx_company (company_id)`);
        console.log('✅ Added idx_company');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ company_id already exists');
        } else {
            console.error('❌ Failed to add company_id:', e.message);
        }
    }

    // Verify columns
    try {
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM customers");
        console.log('FINAL COLUMNS:', JSON.stringify(columns.map((c: any) => c.Field), null, 2));
    } catch (e) {
        console.error('Failed to show columns');
    }

    connection.end();
}

main().catch(console.error);
