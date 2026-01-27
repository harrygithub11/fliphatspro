
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

    console.log('=== EMERGENCY DROP FK ===');

    // Attempt to find and drop ANY foreign key on user_presence
    const [rows]: any = await connection.execute(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_NAME = 'user_presence' 
        AND COLUMN_NAME = 'userId'
        AND REFERENCED_TABLE_NAME IS NOT NULL
        AND TABLE_SCHEMA = '${process.env.DB_NAME}'
    `);

    if (rows.length === 0) {
        console.log('No Foreign Keys found on user_presence.userId. Good?');
    } else {
        for (const row of rows) {
            console.log(`Dropping FK: ${row.CONSTRAINT_NAME}`);
            try {
                await connection.execute(`ALTER TABLE user_presence DROP FOREIGN KEY ${row.CONSTRAINT_NAME}`);
                console.log('✅ DROPPED.');
            } catch (e: any) {
                console.error('Failed to drop:', e.message);
            }
        }
    }

    // Also drop the index if it's causing issues (though index is usually fine)
    // Actually, keep the index for speed. Just the FK constraint causes P2003.

    console.log('--- FINAL CHECK ---');
    const [check]: any = await connection.execute("SHOW CREATE TABLE user_presence");
    console.log(check[0]['Create Table']);

    connection.end();
}

main().catch(console.error);
