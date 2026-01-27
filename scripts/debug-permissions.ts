
import mysql from 'mysql2/promise'

async function debug() {
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

        // 1. List Users
        const [users]: any = await connection.execute('SELECT id, email, name FROM users LIMIT 5');
        console.log('Users:', users);

        for (const u of users) {
            // 2. Check Tenant Users
            const [tus]: any = await connection.execute('SELECT * FROM tenant_users WHERE user_id = ?', [u.id]);
            console.log(`Tenant Roles for ${u.email}:`, tus);

            for (const tu of tus) {
                if (tu.role_id) {
                    const [tr]: any = await connection.execute('SELECT * FROM tenant_roles WHERE id = ?', [tu.role_id]);
                    console.log(`  -> Role Definition [ID: ${tu.role_id}]:`, tr);
                } else {
                    console.log(`  -> No Role ID (Using basic role string: ${tu.role})`);
                }
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

debug();
