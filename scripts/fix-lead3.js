require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixLead3() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== Fixing Lead 3 Tenant ===\n');

    // Get Tcompany01's tenant ID
    const [tenants] = await conn.execute("SELECT id FROM tenants WHERE name = 'Tcompany01'");
    if (tenants.length === 0) {
        console.log('ERROR: Tcompany01 tenant not found!');
        await conn.end();
        return;
    }
    const correctTenantId = tenants[0].id;
    console.log('Tcompany01 tenant ID:', correctTenantId);

    // Get lead 3's current tenant
    const [leads] = await conn.execute('SELECT id, name, tenant_id FROM customers WHERE id = 3');
    if (leads.length === 0) {
        console.log('ERROR: Lead 3 not found!');
        await conn.end();
        return;
    }
    console.log('Lead 3 current tenant_id:', leads[0].tenant_id);

    if (leads[0].tenant_id === correctTenantId) {
        console.log('\n✅ Lead 3 already has correct tenant ID!');
    } else {
        console.log('\n⚠️  Updating lead 3 tenant...');
        await conn.execute('UPDATE customers SET tenant_id = ? WHERE id = 3', [correctTenantId]);
        console.log('✅ Lead 3 updated to tenant:', correctTenantId);
    }

    await conn.end();
}

fixLead3().catch(console.error);
