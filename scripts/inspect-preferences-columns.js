
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectColumns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [cols] = await connection.execute('DESCRIBE admin_preferences');
        console.log("Columns:", cols.map(c => c.Field).join(', '));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

inspectColumns();
