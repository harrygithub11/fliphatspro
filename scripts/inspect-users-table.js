
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inspectUsers() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fliphatspro'
    });

    try {
        console.log("--- DESCRIBE users ---");
        const [userCols] = await connection.execute('DESCRIBE users');
        console.table(userCols);

        console.log("\n--- DESCRIBE admins ---");
        const [adminCols] = await connection.execute('DESCRIBE admins');
        console.table(adminCols);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await connection.end();
    }
}

inspectUsers();
