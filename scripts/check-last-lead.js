const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLastLead() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
        console.log('--- Checking Last 5 Customers ---');
        const [rows] = await connection.execute(
            'SELECT id, name, email, source, facebook_lead_id, created_at FROM customers ORDER BY id DESC LIMIT 5'
        );
        console.table(rows);
    } catch (e) {
        console.error(e);
    } finally {
        connection.end();
    }
}

checkLastLead();
