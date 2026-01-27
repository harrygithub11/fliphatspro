
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    console.log('=== BACKFILLING TENANT_ID ===');

    // Set a default tenant ID. Assuming 'admin' or matching the one usually used.
    // Let's check if there are any tenants first?
    // For now, hardcode 'admin' as it's the safest bet for single-tenant dev setup turned multi-tenant.
    const DEFAULT_TENANT_ID = 'admin';

    try {
        // Update smtp_accounts
        const [res]: any = await connection.execute(`
            UPDATE smtp_accounts 
            SET tenant_id = ? 
            WHERE tenant_id IS NULL OR tenant_id = ''
        `, [DEFAULT_TENANT_ID]);
        console.log(`✅ Updated ${res.affectedRows} smtp_accounts to tenant_id='${DEFAULT_TENANT_ID}'`);

        // Update emails
        const [res2]: any = await connection.execute(`
            UPDATE emails 
            SET tenant_id = ? 
            WHERE tenant_id IS NULL OR tenant_id = ''
        `, [DEFAULT_TENANT_ID]);
        console.log(`✅ Updated ${res2.affectedRows} emails to tenant_id='${DEFAULT_TENANT_ID}'`);

    } catch (e: any) {
        console.error('❌ Update failed:', e.message);
    }

    connection.end();
}

main().catch(console.error);
