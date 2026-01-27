
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

    console.log('=== FIXING TENANT_ID MISMATCH ===');

    // The Tenant ID observed in logs
    const ACTIVE_TENANT_ID = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';

    try {
        // Update smtp_accounts
        // We update ALL rows where tenant_id is 'admin' OR NULL, to be safe.
        // Assuming single-tenant usage for this user.
        const [res]: any = await connection.execute(`
            UPDATE smtp_accounts 
            SET tenant_id = ? 
            WHERE tenant_id = 'admin' OR tenant_id IS NULL OR tenant_id = ''
        `, [ACTIVE_TENANT_ID]);
        console.log(`✅ Updated ${res.affectedRows} smtp_accounts to tenant_id='${ACTIVE_TENANT_ID}'`);

        // Update emails
        const [res2]: any = await connection.execute(`
            UPDATE emails 
            SET tenant_id = ? 
             WHERE tenant_id = 'admin' OR tenant_id IS NULL OR tenant_id = ''
        `, [ACTIVE_TENANT_ID]);
        console.log(`✅ Updated ${res2.affectedRows} emails to tenant_id='${ACTIVE_TENANT_ID}'`);

    } catch (e: any) {
        console.error('❌ Update failed:', e.message);
    }

    connection.end();
}

main().catch(console.error);
