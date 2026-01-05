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

        console.log("Adding ip_address column...");

        await connection.execute("ALTER TABLE admin_activity_logs ADD COLUMN ip_address VARCHAR(45) NULL");

        console.log("Successfully added ip_address column");
        await connection.end();
    } catch (error) {
        console.error("Failed to update schema:", error);
    }
}

fixSchema();
