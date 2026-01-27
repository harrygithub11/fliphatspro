const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnose404() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Diagnosing 404 Error ===\n');

    // Check if any leads exist
    console.log('1. Checking for leads...');
    const [allLeads] = await connection.execute('SELECT id, name, email, tenant_id FROM customers ORDER BY id LIMIT 5');

    if (allLeads.length === 0) {
        console.log('   ❌ NO LEADS FOUND in database');
        console.log('   This is why you get 404 - there are no leads to view!\n');
        console.log('   Create a lead first by visiting: http://crm.localhost:3057/admin/leads');
    } else {
        console.log(`   ✅ Found ${allLeads.length} leads:`);
        allLeads.forEach(lead => {
            console.log(`      - ID ${lead.id}: ${lead.name} (tenant: ${lead.tenant_id})`);
        });

        // Check if lead ID 2 specifically exists
        console.log('\n2. Checking for lead ID 2...');
        const [lead2] = await connection.execute('SELECT * FROM customers WHERE id = 2');
        if (lead2.length === 0) {
            console.log('   ❌ Lead ID 2 does NOT exist');
            console.log(`   Try this URL instead: http://crm.localhost:3057/admin/leads/${allLeads[0].id}`);
        } else {
            console.log('   ✅ Lead ID 2 exists:', lead2[0].name);
            console.log('   The 404 might be an authentication/tenant issue');
        }
    }

    await connection.end();
    console.log('\n=== Diagnostic Complete ===');
}

diagnose404().catch(console.error);
