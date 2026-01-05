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

        console.log("Adding onboarding_status column to orders...");

        await connection.execute(`
            ALTER TABLE orders 
            ADD COLUMN onboarding_status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending'
        `);

        console.log("Successfully added onboarding_status column");
        await connection.end();
    } catch (error) {
        console.error("Failed to update schema:", error);
    }
}

fixSchema();
