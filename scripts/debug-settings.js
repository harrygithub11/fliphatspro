const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSettings() {
    console.log('Connecting to database:', process.env.DATABASE_URL);
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        console.log('--- Checking table: system_settings ---');
        const [rows] = await connection.execute('SELECT * FROM system_settings');
        if (rows.length === 0) {
            console.log('Table is EMPTY.');
        } else {
            console.log('Found rows:', rows);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSettings();
