require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkLead3() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== Checking Lead ID 3 ===\n');

    // Get lead 3
    const [leads] = await conn.execute('SELECT id, name, email, tenant_id, created_at FROM customers WHERE id = 3');

    if (leads.length === 0) {
        console.log('Lead ID 3 not found!');
    } else {
        const lead = leads[0];
        console.log('Lead 3 Details:');
        console.log(`  Name: ${lead.name}`);
        console.log(`  Email: ${lead.email}`);
        console.log(`  Tenant ID: ${lead.tenant_id}`);
        console.log(`  Created: ${lead.created_at}`);

        // Get tenant info
        const [tenants] = await conn.execute('SELECT id, name FROM tenants WHERE id = ?', [lead.tenant_id]);
        if (tenants.length > 0) {
            console.log(`\nTenant: ${tenants[0].name} (ID: ${tenants[0].id})`);
        } else {
            console.log('\nWARN: No matching tenant found for tenant_id:', lead.tenant_id);
        }

        // Check what tenants exist
        console.log('\n=== All Tenants ===');
        const [allTenants] = await conn.execute('SELECT id, name FROM tenants LIMIT 5');
        allTenants.forEach(t => console.log(`  ${t.id}: ${t.name}`));
    }

    await conn.end();
}

checkLead3().catch(console.error);
