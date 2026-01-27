
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔧 Fixing DB User Permissions...');

    // Connect as ROOT (which we know works)
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword', // From docker-compose
        database: process.env.DB_NAME || 'fliphatspro',
        multipleStatements: true
    });

    try {
        console.log('✅ Connected as root.');

        const user = 'flipuser';
        const pass = 'flippass123'; // The password from .env

        // 1. Check if user exists
        const [users] = await connection.execute(
            "SELECT User, Host FROM mysql.user WHERE User = ?",
            [user]
        );
        console.log('Existing Users:', users);

        // 2. Re-create/Update user grants
        // We grant to '%' to allow access from any host (container or local)
        const sql = `
            CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${pass}';
            ALTER USER '${user}'@'%' IDENTIFIED BY '${pass}';
            GRANT ALL PRIVILEGES ON *.* TO '${user}'@'%' WITH GRANT OPTION;
            
            -- Also ensure localhost access just in case
            CREATE USER IF NOT EXISTS '${user}'@'localhost' IDENTIFIED BY '${pass}';
            ALTER USER '${user}'@'localhost' IDENTIFIED BY '${pass}';
            GRANT ALL PRIVILEGES ON *.* TO '${user}'@'localhost' WITH GRANT OPTION;
            
            FLUSH PRIVILEGES;
        `;

        await connection.query(sql);
        console.log(`✅ Permissions granted for '${user}' with password '${pass}'`);

    } catch (error) {
        console.error('❌ Failed to fix permissions:', error.message);
    } finally {
        await connection.end();
    }
}

run();
