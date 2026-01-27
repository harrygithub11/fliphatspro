const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixCustomersTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Fixing Customers Table ===\n');

    // Check current structure
    console.log('1. Checking customers table structure...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM customers');
    const existingCols = columns.map(c => c.Field);
    console.log('   Current columns:', existingCols.join(', '));

    // Add owner_id
    if (!existingCols.includes('owner_id')) {
        console.log('\n2. Adding owner_id column...');
        try {
            await connection.execute('ALTER TABLE customers ADD COLUMN owner_id INT NULL');
            console.log('   ✓ Added owner_id');
        } catch (e) {
            console.error('   ✗ Failed to add owner_id:', e.message);
        }
    } else {
        console.log('\n   ✓ owner_id already exists');
    }

    // Add created_by if missing (saw it in the query too)
    if (!existingCols.includes('created_by')) {
        console.log('\n3. Adding created_by column...');
        try {
            await connection.execute('ALTER TABLE customers ADD COLUMN created_by INT NULL');
            console.log('   ✓ Added created_by');
        } catch (e) {
            console.error('   ✗ Failed to add created_by:', e.message);
        }
    } else {
        console.log('\n   ✓ created_by already exists');
    }

    await connection.end();
    console.log('\n=== Complete! Please restart dev server. ===');
}

fixCustomersTable().catch(console.error);
