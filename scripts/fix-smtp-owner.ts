
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
        console.log('--- CHECKING ORPHANED SMTP ACCOUNTS ---');

        // 1. Get Accounts with NULL tenant_id
        const [accounts]: any = await connection.execute(
            'SELECT id, name, username, tenant_id FROM smtp_accounts WHERE tenant_id IS NULL'
        );

        if (accounts.length === 0) {
            console.log('No orphaned SMTP accounts found. All linked to tenants.');

            // Debug: Show all accounts anyway
            const [all]: any = await connection.execute('SELECT id, name, username, tenant_id FROM smtp_accounts');
            console.table(all);
            return;
        }

        console.log(`Found ${accounts.length} orphaned accounts:`);
        console.table(accounts);

        // 2. Get Main Tenant (Tcompany01)
        // We know the slug is likely 'Tcompany01' from previous screenshots, or 'fliphats'
        const [tenants]: any = await connection.execute(
            "SELECT id, name FROM tenants ORDER BY created_at DESC LIMIT 1"
        );

        if (tenants.length > 0) {
            const mainTenant = tenants[0];
            console.log(`\nLinking orphans to main tenant: ${mainTenant.name} (${mainTenant.id})`);

            for (const acc of accounts) {
                await connection.execute(
                    'UPDATE smtp_accounts SET tenant_id = ? WHERE id = ?',
                    [mainTenant.id, acc.id]
                );
                console.log(` -> Linked account '${acc.username}' to tenant.`);
            }
        } else {
            console.log('No tenants found to link to!');
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        connection.end();
    }
}

main();
