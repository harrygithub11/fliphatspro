
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    console.log('🔧 Fixing Schema AUTO_INCREMENT (CHANGE Strategy)...');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: 'root',
        password: 'rootpassword',
        database: process.env.DB_NAME || 'fliphatspro',
        multipleStatements: true
    });

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('FK Checks Disabled.');

        // Users
        console.log('Fixing users...');
        try {
            // Using CHANGE syntax to be explicit
            await connection.query('ALTER TABLE users CHANGE id id INT NOT NULL AUTO_INCREMENT');
            console.log('✅ Users table fixed.');
        } catch (e) {
            console.error('❌ User fix failed:', e.message);
        }

        // Tenants
        console.log('Fixing tenants...');
        try {
            await connection.query('ALTER TABLE tenants CHANGE id id INT NOT NULL AUTO_INCREMENT');
            console.log('✅ Tenants table fixed.');
        } catch (e) {
            console.error('❌ Tenant fix failed:', e.message);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // VERIFY IMMEDIATELY
        console.log('\n--- VERIFICATION ---');
        const [u] = await connection.query("SHOW COLUMNS FROM users WHERE Field = 'id'");
        console.log('Users ID Extra:', u[0].Extra); // Should be 'auto_increment'

        const [t] = await connection.query("SHOW COLUMNS FROM tenants WHERE Field = 'id'");
        console.log('Tenants ID Extra:', t[0].Extra); // Should be 'auto_increment'

    } catch (error) {
        console.error('❌ Global Error:', error.message);
    } finally {
        await connection.end();
    }
}

run();
