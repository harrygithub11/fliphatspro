
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== CHECKING SMTP_ACCOUNTS SCHEMA ===');
    const [cols]: any = await connection.execute('SHOW COLUMNS FROM smtp_accounts');
    console.log('Columns:', cols.map((c: any) => c.Field).join(', '));

    const hasTenantId = cols.some((c: any) => c.Field === 'tenant_id');

    if (!hasTenantId) {
        console.log('\n⚠️ tenant_id column is MISSING. Adding it now...');
        await connection.execute('ALTER TABLE smtp_accounts ADD COLUMN tenant_id VARCHAR(255) NULL AFTER id');
        console.log('✅ tenant_id column added.');
    }

    // Get the first tenant UUID
    const [tenants]: any = await connection.execute('SELECT id, name FROM tenants LIMIT 1');
    if (tenants.length === 0) {
        console.log('❌ No tenants found! Cannot link accounts.');
        connection.end();
        return;
    }

    const tenantUUID = tenants[0].id;
    console.log(`\nUsing Tenant: ${tenants[0].name} (${tenantUUID})`);

    // Update all accounts to use this tenant
    const [result]: any = await connection.execute('UPDATE smtp_accounts SET tenant_id = ? WHERE tenant_id IS NULL OR tenant_id = ""', [tenantUUID]);
    console.log(`✅ Updated ${result.affectedRows} accounts to tenant: ${tenantUUID}`);

    // Verify
    const [accounts]: any = await connection.execute('SELECT id, name, from_email, tenant_id, is_active FROM smtp_accounts');
    console.log('\n=== UPDATED ACCOUNTS ===');
    console.table(accounts);

    connection.end();
}

main().catch(console.error);
