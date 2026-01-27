require('dotenv').config();
const mysql = require('mysql2/promise');

async function listLeads() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== All Leads in Database ===\n');

    const [rows] = await conn.execute('SELECT id, name, email FROM customers WHERE deleted_at IS NULL');

    if (rows.length === 0) {
        console.log('No leads found!');
    } else {
        rows.forEach(r => console.log(`  ID ${r.id}: ${r.name} <${r.email}>`));
    }

    await conn.end();
}

listLeads().catch(console.error);
