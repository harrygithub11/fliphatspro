
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'newyear',
};

console.log('--- DB Connection Test ---');
console.log('Config:', { ...config, password: config.password ? '***' : 'missing' });

(async () => {
    try {
        const conn = await mysql.createConnection(config);
        console.log('✅ Connection Successful!');

        const [rows] = await conn.execute('SELECT 1 as val');
        console.log('✅ Query SELECT 1 result:', rows);

        const [tables] = await conn.execute('SHOW TABLES');
        console.log('✅ Tables found:', tables.length);
        console.log('Sample Tables:', tables.slice(0, 5).map(r => Object.values(r)[0]));

        await conn.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        console.error('Code:', err.code);
        console.error('Errno:', err.errno);
        process.exit(1);
    }
})();
