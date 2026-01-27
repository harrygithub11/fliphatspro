
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== TESTING COLUMN EXISTENCE ===');
    try {
        // Try selecting the suspicious columns
        await connection.execute("SELECT id, deleted_at, assigned_to FROM customers LIMIT 1");
        console.log('✅ Columns deleted_at and assigned_to EXIST.');
    } catch (e: any) {
        console.error('❌ Query FAILED:', e.message);

        // Try simpler check
        try {
            await connection.execute("SELECT id, deleted_at FROM customers LIMIT 1");
            console.log('✅ Column deleted_at EXISTS.');
        } catch (e: any) {
            console.error('❌ Column deleted_at MISSING:', e.message);
        }

        try {
            await connection.execute("SELECT id, assigned_to FROM customers LIMIT 1");
            console.log('✅ Column assigned_to EXISTS.');
        } catch (e: any) {
            console.error('❌ Column assigned_to MISSING:', e.message);
        }

        try {
            await connection.execute("SELECT id, owner_id FROM customers LIMIT 1");
            console.log('✅ Column owner_id EXISTS.');
        } catch (e: any) {
            console.error('❌ Column owner_id MISSING:', e.message);
        }
    }

    connection.end();
}

main().catch(console.error);
