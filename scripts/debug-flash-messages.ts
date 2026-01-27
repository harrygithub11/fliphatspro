
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
        console.log('--- CHECKING FLASH MESSAGES ---');
        const [messages]: any = await connection.execute('SELECT id, senderId, receiverId, message FROM flash_messages');
        console.log(`Found ${messages.length} flash messages.`);

        if (messages.length > 0) {
            const senderIds = messages.map((m: any) => m.senderId).filter((id: any) => id).join(',');

            if (senderIds) {
                const [users]: any = await connection.execute(`SELECT id FROM users WHERE id IN (${senderIds})`);
                const existingUserIds = new Set(users.map((u: any) => u.id));

                const orphans = messages.filter((m: any) => !existingUserIds.has(m.senderId));

                if (orphans.length > 0) {
                    console.log('!!! FOUND ORPHAN MESSAGES !!!');
                    console.table(orphans);

                    console.log('Deleting orphans...');
                    const orphanIds = orphans.map((m: any) => `'${m.id}'`).join(',');
                    await connection.execute(`DELETE FROM flash_messages WHERE id IN (${orphanIds})`);
                    console.log('Deleted orphan messages.');
                } else {
                    console.log('No orphan messages found (All senders exist in users table).');
                }
            }
        }

        console.log('\n--- CHECKING CURRENT SESSION USER ---');
        // We can't easily check the session from here without the cookie value, 
        // but we can check if ANY users exist.
        const [users]: any = await connection.execute('SELECT id, email, name FROM users LIMIT 5');
        console.log('Existing Users:');
        console.table(users);

    } catch (e: any) {
        console.error(e.message);
    } finally {
        connection.end();
    }
}

main();
