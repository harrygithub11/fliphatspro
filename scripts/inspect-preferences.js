
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
        console.log("--- DESCRIBE admin_preferences ---");
        const [cols] = await connection.execute('DESCRIBE admin_preferences');
        console.table(cols);

        console.log("\n--- SHOW CREATE TABLE admin_preferences ---");
        const [create] = await connection.execute('SHOW CREATE TABLE admin_preferences');
        console.log(create[0]['Create Table']);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

inspectPreferences();
