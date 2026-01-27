const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkLeadDetails() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Lead ID 2 ===\n');

    const [leads] = await connection.execute('SELECT * FROM customers WHERE id = 2');

    if (leads.length === 0) {
        console.log('❌ Lead ID 2 does NOT exist in the database.');
    } else {
        const lead = leads[0];
        console.log('✅ Lead Found:');
        console.log(`   - Name: ${lead.name}`);
        console.log(`   - ID: ${lead.id}`);
        console.log(`   - Tenant ID: ${lead.tenant_id}`);
        console.log(`   - Deleted At: ${lead.deleted_at ? lead.deleted_at : 'NULL (Active)'}`);
        console.log(`   - Created By: ${lead.created_by}`);
    }

    console.log('\n=== Checking Current Tenant Context ===');
    // We can't easily check the user's cookie from here, but we can list active tenants
    const [tenants] = await connection.execute('SELECT id, name, slug FROM tenants LIMIT 5');
    console.log('Active Tenants in DB:');
    tenants.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));

    await connection.end();
}

checkLeadDetails().catch(console.error);
