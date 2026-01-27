const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLeads() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('Checking for leads in database...\n');

    const [leads] = await connection.execute('SELECT id, name, email FROM customers LIMIT 10');

    if (leads.length === 0) {
        console.log('❌ No leads found in database!');
        console.log('The 404 error is because there are no leads to view.');
    } else {
        console.log(`✅ Found ${leads.length} leads:`);
        leads.forEach(lead => {
            console.log(`   - ID ${lead.id}: ${lead.name} <${lead.email}>`);
        });
        console.log(`\nTry visiting: http://crm.localhost:3057/admin/leads/${leads[0].id}`);
    }

    await connection.end();
}

checkLeads().catch(console.error);
