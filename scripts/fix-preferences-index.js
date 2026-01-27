
const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPreferences() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log("Truncating admin_preferences to remove duplicates...");
        await connection.execute('TRUNCATE TABLE admin_preferences');

        console.log("Adding UNIQUE INDEX on admin_id...");
        await connection.execute('ALTER TABLE admin_preferences ADD UNIQUE INDEX idx_admin_pref_user (admin_id)');

        console.log("Success! References to admin_id will now be unique.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

fixPreferences();
