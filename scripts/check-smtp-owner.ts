
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
        console.log('--- CHECKING SMTP OWNERSHIP ---');

        const [accounts]: any = await connection.execute(
            'SELECT id, username, tenant_id, created_by FROM smtp_accounts'
        );

        console.table(accounts);

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
