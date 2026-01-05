const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSettings() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Checking settings table structure...\n');
        const [columns] = await connection.execute('DESCRIBE settings');
        console.log('Table structure:');
        console.table(columns);

        console.log('\nCurrent data:');
        const [rows] = await connection.execute('SELECT * FROM settings LIMIT 5');
        console.table(rows);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSettings();
