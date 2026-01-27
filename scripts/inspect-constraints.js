
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectPreferences() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log("Checking admin_preferences keys:");
        const [keys] = await connection.execute(
            `SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = 'admin_preferences' AND TABLE_SCHEMA = ?`,
            [process.env.DB_NAME || 'fliphatspro']
        );
        console.table(keys);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

inspectPreferences();
