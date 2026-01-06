const mysql = require('mysql2/promise');
require('dotenv').config();

async function listTables() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables:', rows.map(r => Object.values(r)[0]));
    await connection.end();
}

listTables();
