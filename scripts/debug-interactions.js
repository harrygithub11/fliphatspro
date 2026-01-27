
const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugInteractions() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log("--- Checking Interactions Data ---");
        const [interactions] = await connection.execute('SELECT id, type, content, created_by, created_at FROM interactions ORDER BY created_at DESC LIMIT 5');
        console.table(interactions);

        if (interactions.length > 0) {
            const firstUserId = interactions[0].created_by;
            console.log(`\n--- Checking User for ID: ${firstUserId} ---`);

            // Check in users table
            const [users] = await connection.execute('SELECT id, name, email FROM users WHERE id = ?', [firstUserId]);
            console.log("Found in users table:", users);

            // Check in admins table (just in case)
            try {
                const [admins] = await connection.execute('SELECT id, name, email FROM admins WHERE id = ?', [firstUserId]);
                console.log("Found in admins table:", admins);
            } catch (e) {
                console.log("Admins table query failed (table might not exist or ID mismatch).");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

debugInteractions();
