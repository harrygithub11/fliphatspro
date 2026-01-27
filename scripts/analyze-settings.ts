
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    try {
        console.log('--- ANALYZING SETTINGS STORAGE ---');

        // 1. Check 'settings' column in 'tenants' table
        const [tenants]: any = await connection.execute(
            'SELECT id, name, settings FROM tenants'
        );

        const tenantsWithSettings = tenants.filter((t: any) => t.settings !== null);
        console.log(`\nTable 'tenants':`);
        console.log(`Total Tenants: ${tenants.length}`);
        console.log(`Tenants with 'settings' JSON blob: ${tenantsWithSettings.length}`);
        if (tenantsWithSettings.length > 0) {
            console.log('Sample JSON setting:', tenantsWithSettings[0].settings);
        } else {
            console.log('-> ' + 'All settings columns are NULL (Unused)');
        }

        // 2. Check 'tenant_settings' table
        const [rows]: any = await connection.execute(
            'SELECT * FROM tenant_settings LIMIT 10'
        );
        console.log(`\nTable 'tenant_settings' (Normalized Storage):`);
        const [count]: any = await connection.execute('SELECT COUNT(*) as cnt FROM tenant_settings');
        console.log(`Total Rows: ${count[0].cnt}`);

        if (rows.length > 0) {
            console.table(rows.map((r: any) => ({
                tenant_id: r.tenant_id,
                key: r.setting_key,
                value: r.setting_value ? r.setting_value.substring(0, 30) + '...' : 'NULL'
            })));
        } else {
            console.log('-> No data in tenant_settings table.');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
