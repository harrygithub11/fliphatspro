
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

    console.log('=== FIXING CUSTOMERS TABLE (OWNER_ID) ===');

    // Add owner_id
    try {
        console.log('Attempting to add owner_id...');
        await connection.execute(`ALTER TABLE customers ADD COLUMN owner_id INT NULL AFTER created_by`);
        console.log('✅ Added owner_id');
        await connection.execute(`ALTER TABLE customers ADD INDEX idx_owner (owner_id)`);
        console.log('✅ Added idx_owner');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️ owner_id already exists');
        } else {
            console.error('❌ Failed to add owner_id:', e.message);
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
