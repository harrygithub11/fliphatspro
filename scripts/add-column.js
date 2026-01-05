
const mysql = require('mysql2/promise');

const DATABASE_URL = "mysql://root:admin@127.0.0.1:3307/newyear";

async function migrate() {
    try {
        const connection = await mysql.createConnection(DATABASE_URL);
        console.log("Connected to database.");

        try {
            // Check for onboarding_status
            const [columns] = await connection.query("SHOW COLUMNS FROM orders LIKE 'onboarding_status'");

            if (columns.length === 0) {
                console.log("Column 'onboarding_status' missing. Adding it...");
                await connection.query("ALTER TABLE orders ADD COLUMN onboarding_status ENUM('pending', 'completed') DEFAULT 'pending'");
                console.log("Added 'onboarding_status'.");
            } else {
                console.log("Column 'onboarding_status' already exists.");
            }


        } catch (e) {
            console.error("Query failed:", e.message);
        } finally {
            await connection.end();
        }
    } catch (e) {
        console.error("Connection failed:", e.message);
    }
}

migrate();
