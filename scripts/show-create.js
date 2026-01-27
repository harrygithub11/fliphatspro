
const mysql = require('mysql2/promise');
require('dotenv').config();

async function showCreate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [rows] = await connection.execute('SHOW CREATE TABLE admin_preferences');
        console.log(rows[0]['Create Table']);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

showCreate();
