
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

    console.log('=== VERIFYING FK IS GONE ===');

    // User ID 999999 likely implies invalid user. 
    // If FK exists, this MUST fail.
    // If FK is gone, this MUST succeed.

    try {
        await connection.execute(`
            INSERT INTO user_presence (userId, status, lastSeenAt) 
            VALUES (999999, 'ONLINE', NOW())
            ON DUPLICATE KEY UPDATE lastSeenAt = NOW()
        `);
        console.log('✅ INSERT SUCCEEDED with invalid userId 999999.');
        console.log('🎉 CONCLUSION: Foreign Key is GONE.');

        // Clean up
        await connection.execute("DELETE FROM user_presence WHERE userId = 999999");

    } catch (e: any) {
        console.error('❌ INSERT FAILED:', e.message);
        console.log('💀 CONCLUSION: Foreign Key STILL EXISTS.');
    }

    connection.end();
}

main().catch(console.error);
