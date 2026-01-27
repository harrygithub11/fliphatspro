const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCustomerSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Customers Schema ===\n');
    const [cols] = await connection.execute("SHOW COLUMNS FROM customers LIKE 'stage'");
    console.table(cols);

    const [scoreCols] = await connection.execute("SHOW COLUMNS FROM customers LIKE 'score'");
    console.table(scoreCols);

    await connection.end();
}

checkCustomerSchema().catch(console.error);
