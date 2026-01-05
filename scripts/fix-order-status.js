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

        console.log("Altering orders table status enum...");

        // Add 'new_lead' to the enum list
        await connection.execute(`
            ALTER TABLE orders 
            MODIFY COLUMN status ENUM(
                'new_lead',
                'initiated',
                'payment_failed',
                'paid',
                'onboarding_pending',
                'processing',
                'delivered',
                'cancelled'
            ) NOT NULL DEFAULT 'initiated'
        `);

        console.log("Successfully added 'new_lead' to status enum");
        await connection.end();
    } catch (error) {
        console.error("Failed to update schema:", error);
    }
}

fixSchema();
