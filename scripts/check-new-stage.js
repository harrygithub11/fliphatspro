const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStageStatus() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Stage "custom_test" ===\n');

    const [rows] = await connection.execute(
        'SELECT * FROM lead_stages WHERE value = "custom_test"'
    );

    if (rows.length > 0) {
        console.table(rows);
    } else {
        console.log('❌ Stage "custom_test" NOT found in DB!');
    }

    console.log('\n=== Checking Default for is_active ===');
    const [cols] = await connection.execute("SHOW COLUMNS FROM lead_stages LIKE 'is_active'");
    console.table(cols);

    await connection.end();
}

checkStageStatus().catch(console.error);
