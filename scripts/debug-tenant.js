require('dotenv').config();
const mysql = require('mysql2/promise');

async function debug() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== Debug Lead 3 Tenant Match ===\n');

    // Get all tenants
    console.log('All Tenants:');
    const [tenants] = await conn.execute('SELECT id, name FROM tenants');
    tenants.forEach(t => console.log(`  ${t.id}: ${t.name}`));

    // Get lead 3
    console.log('\nLead 3:');
    const [leads] = await conn.execute('SELECT id, name, tenant_id FROM customers WHERE id = 3');
    if (leads.length === 0) {
        console.log('  Lead 3 NOT FOUND');
    } else {
        console.log(`  tenant_id: ${leads[0].tenant_id}`);

        // Check if tenant matches
        const match = tenants.find(t => t.id === leads[0].tenant_id);
        if (match) {
            console.log(`  MATCH! Tenant: ${match.name}`);
        } else {
            console.log('  NO MATCH FOUND!');
        }
    }

    await conn.end();
}

debug().catch(console.error);
