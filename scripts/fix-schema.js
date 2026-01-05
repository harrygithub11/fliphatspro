require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME || 'newyearlp',
        });

        console.log("Altering admin_activity_logs table...");

        // Change action_type to VARCHAR(255) to support any string
        await connection.execute("ALTER TABLE admin_activity_logs MODIFY COLUMN action_type VARCHAR(255) NOT NULL");

        console.log("Successfully updated action_type to VARCHAR(255)");
        await connection.end();
    } catch (error) {
        console.error("Failed to update schema:", error);
    }
}

fixSchema();
