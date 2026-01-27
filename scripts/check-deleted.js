require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== Lead 3 Full Check ===\n');

    const [rows] = await conn.execute(`
        SELECT 
            id, 
            name, 
            email, 
            tenant_id, 
            deleted_at,
            CASE WHEN deleted_at IS NULL THEN 'ACTIVE' ELSE 'DELETED' END as status
        FROM customers 
        WHERE id = 3
    `);

    if (rows.length === 0) {
        console.log('Lead 3 not found in database!');
    } else {
        const lead = rows[0];
        console.log('Lead found:');
        console.log(JSON.stringify(lead, null, 2));

        if (lead.deleted_at) {
            console.log('\n⚠️  LEAD IS SOFT DELETED!');
            console.log('Fix: Run UPDATE customers SET deleted_at = NULL WHERE id = 3;');
        }
    }

    await conn.end();
}

check().catch(console.error);
