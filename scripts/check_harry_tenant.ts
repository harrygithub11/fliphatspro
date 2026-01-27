
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('Searching for users named Harry...');
    const [users]: any = await connection.execute('SELECT id, email, name FROM users WHERE name LIKE ?', ['%Harry%']);
    console.log('Found Users:', users);

    if (users.length > 0) {
        const userIds = users.map((u: any) => u.id);
        const [memberships]: any = await connection.execute(
            `SELECT tu.*, t.name as tenant_name FROM tenant_users tu JOIN tenants t ON tu.tenant_id = t.id WHERE tu.user_id IN (${userIds.join(',')})`
        );
        console.log('Memberships:', memberships);
    }

    connection.end();
}

main().catch(console.error);
