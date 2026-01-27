
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
        console.log('--- BACKFILLING EMAILS TENANT ID ---');

        // 1. Get Accounts with tenant_id
        const [accounts]: any = await connection.execute(
            'SELECT id, tenant_id FROM smtp_accounts WHERE tenant_id IS NOT NULL'
        );

        console.log(`Found ${accounts.length} accounts with tenant_id.`);

        for (const acc of accounts) {
            console.log(`Processing Account ID: ${acc.id}, Tenant: ${acc.tenant_id}`);

            const [res]: any = await connection.execute(
                'UPDATE emails SET tenant_id = ? WHERE smtp_account_id = ? AND tenant_id IS NULL',
                [acc.tenant_id, acc.id]
            );

            console.log(` -> Updated ${res.affectedRows} emails.`);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
