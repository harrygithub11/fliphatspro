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

        const [rows] = await connection.execute("DESCRIBE orders");
        rows.forEach(r => {
            if (r.Field === 'status') console.log(`${r.Field}: ${r.Type}`);
        });

        await connection.end();
    } catch (error) {
        console.error(error);
    }
}

checkSchema();
