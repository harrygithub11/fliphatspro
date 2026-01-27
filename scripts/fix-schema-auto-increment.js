
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔧 Fixing AUTO_INCREMENT as ROOT...');

    // FORCE ROOT CONNECTION
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword', // Known docker default
        database: process.env.DB_NAME || 'fliphatspro',
        multipleStatements: true
    });

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('ForeignKey Checks Disabled.');

        // Fix users schema - Force ID to be AUTO_INCREMENT
        console.log('Fixing users table...');
        try {
            await connection.query('ALTER TABLE users MODIFY COLUMN id INT AUTO_INCREMENT');
            console.log('✅ Users table fixed.');
        } catch (e) {
            console.error('❌ User fix failed:', e.message);
        }

        // Fix tenants schema
        console.log('Fixing tenants table...');
        try {
            await connection.query('ALTER TABLE tenants MODIFY COLUMN id INT AUTO_INCREMENT');
            console.log('✅ Tenants table fixed.');
        } catch (e) {
            console.error('❌ Tenant fix failed:', e.message);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('ForeignKey Checks Re-enabled.');

    } catch (error) {
        console.error('❌ Global Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
