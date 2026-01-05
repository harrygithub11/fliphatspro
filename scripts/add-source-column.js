const mysql = require('mysql2/promise');

async function addSourceColumn() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        port: 3307,
        user: 'root',
        password: 'admin',
        database: 'newyear'
    });

    try {
        console.log('Checking for "source" column in orders table...');
        const [columns] = await connection.execute("SHOW COLUMNS FROM orders LIKE 'source'");

        if (columns.length === 0) {
            console.log('Adding "source" column...');
            await connection.execute("ALTER TABLE orders ADD COLUMN source VARCHAR(50) DEFAULT 'website'");
            console.log('✅ Added "source" column successfully.');
        } else {
            console.log('ℹ️ "source" column already exists.');
        }

    } catch (error) {
        console.error('❌ Error updating database:', error.message);
    } finally {
        await connection.end();
    }
}

addSourceColumn();
