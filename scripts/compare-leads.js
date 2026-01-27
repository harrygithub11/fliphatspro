const mysql = require('mysql2/promise');
require('dotenv').config();

async function compareLeads() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Comparing Leads ===\n');

    // Get the manual lead (latest one) and the marketing lead (ID 2)
    const [leads] = await connection.execute(
        'SELECT id, name, tenant_id, source FROM customers ORDER BY id DESC LIMIT 5'
    );

    console.log('Recent Leads:');
    leads.forEach(l => {
        console.log(`- ID: ${l.id} | Name: ${l.name} | Source: ${l.source}`);
        console.log(`  Tenant ID: ${l.tenant_id}`);
        console.log('  -----------------------------------------');
    });

    await connection.end();
}

compareLeads().catch(console.error);
