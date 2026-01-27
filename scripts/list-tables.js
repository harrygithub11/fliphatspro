
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        const [rows] = await connection.query('SHOW TABLES');
        console.log('Tables:', rows.map(r => Object.values(r)[0]));
        connection.end();
    } catch (error) {
        console.error(error);
    }
})();
