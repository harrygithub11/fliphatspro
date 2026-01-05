const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    // Try to proceed anyway in case env vars are set in shell
}

console.log('--- Database Connection Test ---');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`Port: ${process.env.DB_PORT}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`DB Name: ${process.env.DB_NAME}`);
console.log('--------------------------------');

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'newyear'
        });

        console.log('✅ SUCCESS: Connected to database successfully!');
        const [rows] = await connection.execute('SELECT 1 as val');
        console.log('Test Query Result:', rows);
        await connection.end();
    } catch (error) {
        console.error('❌ FAILED: Could not connect to database.');
        console.error('Error Message:', error.message);
        console.error('Error Code:', error.code);
        if (error.code === 'ECONNREFUSED') {
            console.log('Tip: Check if MySQL is running and the PORT is correct (usually 3306).');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('Tip: Check your USERNAME and PASSWORD. Also verify if the user is allowed to connect from this HOST (127.0.0.1 vs localhost).');
        }
    }
}

testConnection();
