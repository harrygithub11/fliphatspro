
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    try {
        console.log('--- ASSIGNING ORPHANED ACCOUNTS TO OWNER ---');

        // 1. Get Main User (usually ID 1)
        const [users]: any = await connection.execute('SELECT id, email FROM users ORDER BY id ASC LIMIT 1');
        if (users.length === 0) {
            console.log('No users found.');
            return;
        }
        const ownerId = users[0].id;
        console.log(`Main Owner: ${users[0].email} (ID: ${ownerId})`);

        // 2. Update NULL created_by
        const [result]: any = await connection.execute(
            'UPDATE smtp_accounts SET created_by = ? WHERE created_by IS NULL',
            [ownerId]
        );

        console.log(`Updated ${result.affectedRows} accounts to belong to User ID ${ownerId}.`);

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
