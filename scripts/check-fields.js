const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLeadFields() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Stage & Score for Lead 2 ===\n');

    // Select specifically stage and score
    const [rows] = await connection.execute(
        'SELECT id, name, stage, score FROM customers WHERE id = 2'
    );

    if (rows.length > 0) {
        const lead = rows[0];
        console.log(`Lead: ${lead.name}`);
        console.log(`- Stage: '${lead.stage}' (${typeof lead.stage})`);
        console.log(`- Score: '${lead.score}' (${typeof lead.score})`);

        // Also check what valid values are by peeking at other leads
        const [others] = await connection.execute('SELECT DISTINCT stage, score FROM customers LIMIT 10');
        console.log('\nOther values seen in DB:', others);
    } else {
        console.log('Lead 2 not found');
    }

    await connection.end();
}

checkLeadFields().catch(console.error);
