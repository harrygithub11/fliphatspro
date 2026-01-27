
const mysql = require('mysql2/promise');
const path = require('path');
const dotenv = require('dotenv');

// Load .env explicitly
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function run() {
    console.log('🔧 Connection Diagnostics & Fix...');

    // 1. Connect without DB selected to verify server access
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword'
    };

    console.log('Connecting to:', config.host, 'as', config.user);

    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL server.');

        // 2. Check Databases
        const [dbs] = await connection.query('SHOW DATABASES');
        const dbList = dbs.map(d => d.Database);
        console.log('Available Databases:', dbList);

        const targetDb = process.env.DB_NAME || 'fliphatspro';
        if (!dbList.includes(targetDb)) {
            console.error(`❌ Database '${targetDb}' does not exist!`);
            // Optional: Create it? For now just report.
            return;
        }
        console.log(`✅ Database '${targetDb}' exists.`);

        // 3. Fix Permissions
        console.log(`🔨 Fixing permissions for user '${process.env.DB_USER}'...`);
        const user = process.env.DB_USER || 'flipuser';
        const pass = process.env.DB_PASSWORD || 'flippass123';

        const sql = `
            CREATE USER IF NOT EXISTS '${user}'@'%' IDENTIFIED BY '${pass}';
            ALTER USER '${user}'@'%' IDENTIFIED BY '${pass}';
            GRANT ALL PRIVILEGES ON *.* TO '${user}'@'%' WITH GRANT OPTION;
            FLUSH PRIVILEGES;
        `;

        await connection.query(sql);
        console.log('✅ User permissions fixed.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

run();
