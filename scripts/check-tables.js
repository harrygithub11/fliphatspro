const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkTables() {
    console.log('--- Database Table Check ---');
    console.log(`DB: ${process.env.DB_NAME}`);

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306')
        });

        const [rows] = await connection.execute('SHOW TABLES');
        console.log(`\nFound ${rows.length} tables:`);
        rows.forEach(row => {
            console.log(` - ${Object.values(row)[0]}`);
        });

        if (rows.length === 0) {
            console.log('\n❌ WARNING: Database is EMPTY! You need to import the SQL file.');
        } else {
            console.log('\n✅ Tables exist.');

            // Check for specific tables
            const tables = rows.map(r => Object.values(r)[0]);
            const required = ['customers', 'orders', 'interactions'];
            const missing = required.filter(t => !tables.includes(t));

            if (missing.length > 0) {
                console.log(`❌ Missing required tables: ${missing.join(', ')}`);
            } else {
                console.log('✅ All required tables found.');
            }
        }

    } catch (error) {
        console.error('❌ Connection or Query Error:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

checkTables();
