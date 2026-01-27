
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

    console.log('=== FIXING EMAILS TABLE SCHEMA ===\n');

    // Check current columns
    const [cols]: any = await connection.execute('SHOW COLUMNS FROM emails');
    const colNames = cols.map((c: any) => c.Field);
    console.log('Current columns:', colNames.join(', '));

    // Add tenant_id if missing
    if (!colNames.includes('tenant_id')) {
        console.log('\n⚠️ tenant_id missing. Adding...');
        await connection.execute('ALTER TABLE emails ADD COLUMN tenant_id VARCHAR(255) AFTER id');
        console.log('✅ tenant_id added');

        // Get default tenant
        const [tenants]: any = await connection.execute('SELECT id FROM tenants LIMIT 1');
        if (tenants.length > 0) {
            await connection.execute('UPDATE emails SET tenant_id = ? WHERE tenant_id IS NULL', [tenants[0].id]);
            console.log('✅ Updated existing emails with tenant_id:', tenants[0].id);
        }
    } else {
        console.log('✅ tenant_id already exists');
    }

    // Add index for tenant_id if not exists
    try {
        await connection.execute('CREATE INDEX idx_emails_tenant ON emails(tenant_id)');
        console.log('✅ Added index on tenant_id');
    } catch (e: any) {
        if (e.message.includes('Duplicate')) {
            console.log('✅ Index already exists');
        }
    }

    console.log('\n=== DONE ===');
    connection.end();
}

main().catch(console.error);
