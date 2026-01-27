
const mysql = require('mysql2/promise');
require('dotenv').config();

async function showConstraints() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        const [rows] = await connection.execute(
            `SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
             WHERE TABLE_NAME = 'admin_preferences' 
             AND REFERENCED_TABLE_NAME IS NOT NULL
             AND TABLE_SCHEMA = ?`,
            [process.env.DB_NAME || 'fliphatspro']
        );

        if (rows.length === 0) {
            console.log("No foreign keys found on admin_preferences.");
        } else {
            rows.forEach(row => {
                console.log(`FOUND CONSTRAINT: ${row.CONSTRAINT_NAME} on column ${row.COLUMN_NAME} linking to ${row.REFERENCED_TABLE_NAME}`);
            });
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

showConstraints();
