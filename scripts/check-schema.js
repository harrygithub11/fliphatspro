require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME || 'newyearlp',
        });

        const [rows] = await connection.execute("DESCRIBE admin_activity_logs");
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (error) {
        console.error(error);
    }
}

checkSchema();
