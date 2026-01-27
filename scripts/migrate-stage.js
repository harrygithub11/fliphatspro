const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateToVarchar() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Migrating Customers Table ===\n');

    try {
        console.log('Modifying stage column...');
        await connection.execute('ALTER TABLE customers MODIFY COLUMN stage VARCHAR(255) NULL');
        console.log('✓ stage is now VARCHAR(255)');
    } catch (e) {
        console.error('Error modifying stage:', e.message);
    }

    try {
        console.log('Modifying score column...');
        await connection.execute('ALTER TABLE customers MODIFY COLUMN score VARCHAR(255) NULL');
        console.log('✓ score is now VARCHAR(255)');
    } catch (e) {
        console.error('Error modifying score:', e.message);
    }

    // Fix Lead 3
    console.log('\nFixing Lead 3...');
    await connection.execute('UPDATE customers SET stage = "custom_test" WHERE id = 3');
    console.log('✓ Lead 3 stage set to "custom_test"');

    await connection.end();
}

migrateToVarchar().catch(console.error);
