import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Adding Missing smtp_accounts Columns ===\n');

    const addColumn = async (table: string, column: string, type: string) => {
        try {
            await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`✅ Added ${column}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  ${column} already exists`);
            } else {
                console.log(`❌ ${column}: ${e.message}`);
            }
        }
    };

    // Add missing columns to smtp_accounts
    await addColumn('smtp_accounts', 'imap_secure', 'BOOLEAN DEFAULT TRUE');
    await addColumn('smtp_accounts', 'smtp_secure', 'BOOLEAN DEFAULT TRUE');
    await addColumn('smtp_accounts', 'smtp_host', 'VARCHAR(255)');
    await addColumn('smtp_accounts', 'smtp_port', 'INT DEFAULT 587');
    await addColumn('smtp_accounts', 'smtp_user', 'VARCHAR(255)');
    await addColumn('smtp_accounts', 'smtp_pass', 'VARCHAR(255)');
    await addColumn('smtp_accounts', 'daily_limit', 'INT DEFAULT 500');
    await addColumn('smtp_accounts', 'sent_today', 'INT DEFAULT 0');

    // Also add email column alias if needed
    await c.execute(`
        UPDATE smtp_accounts SET smtp_host = host WHERE smtp_host IS NULL AND host IS NOT NULL
    `).catch(() => { });

    await c.execute(`
        UPDATE smtp_accounts SET smtp_port = port WHERE smtp_port IS NULL AND port IS NOT NULL
    `).catch(() => { });

    console.log('\n✅ Done!');
    c.end();
}

main().catch(console.error);
