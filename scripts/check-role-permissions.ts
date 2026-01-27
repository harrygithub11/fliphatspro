
import mysql from 'mysql2/promise'

async function check() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });
        console.log('Connected to DB');

        // Check Role ID 1
        const [roles]: any = await connection.execute('SELECT * FROM tenant_roles WHERE id = 1');
        console.log('Role ID 1:', roles[0]);
        console.log('Permissions:', JSON.stringify(roles[0].permissions, null, 2));

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

check();
