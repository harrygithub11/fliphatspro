
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
        console.log('--- ADMINS ---');
        const [admins]: any = await connection.execute('SELECT id, name, email FROM admins');
        console.table(admins);

        console.log('\n--- USERS ---');
        const [users]: any = await connection.execute('SELECT id, name, email FROM users');
        console.table(users);

        console.log('\n--- TENANT USERS ---');
        const [tenantUsers]: any = await connection.execute('SELECT * FROM tenant_users LIMIT 5');
        console.table(tenantUsers);

    } catch (e: any) {
        console.error(e.message);
    } finally {
        connection.end();
    }
}

main();
