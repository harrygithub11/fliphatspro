
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

    console.log('=== TESTING SMTP_ACCOUNTS INSERT ===');

    try {
        const [result]: any = await connection.execute(`
            INSERT INTO smtp_accounts 
            (tenant_id, created_by, name, provider, host, port, username, encrypted_password, from_email, from_name, imap_host, imap_port, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        `, ['test_tenant', 1, 'Test Account', 'custom', 'smtp.example.com', 587, 'user', 'pass', 'test@example.com', 'Test', 'imap.example.com', 993]);

        console.log('✅ INSERT SUCCEEDED! Insert ID:', result.insertId);

        // Clean up
        await connection.execute('DELETE FROM smtp_accounts WHERE id = ?', [result.insertId]);
        console.log('✅ Cleaned up test record.');

    } catch (e: any) {
        console.error('❌ INSERT FAILED:', e.message);
    }

    connection.end();
}

main().catch(console.error);
