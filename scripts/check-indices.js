
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkIndices() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [indices] = await connection.execute('SHOW INDEX FROM admin_preferences');
        console.table(indices);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

checkIndices();
