import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Fixing Prisma Tables Missing Columns ===\n');

    // Helper function to add column if it doesn't exist
    const addColumn = async (table: string, column: string, type: string) => {
        try {
            await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`✅ Added ${table}.${column}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  ${table}.${column} already exists`);
            } else {
                console.log(`❌ ${table}.${column}: ${e.message}`);
            }
        }
    };

    // marketing_campaign table
    console.log('--- marketing_campaign ---');
    await addColumn('marketing_campaign', 'created_by', 'INT NULL');
    await addColumn('marketing_campaign', 'subject', 'VARCHAR(500)');
    await addColumn('marketing_campaign', 'body_html', 'LONGTEXT');
    await addColumn('marketing_campaign', 'body_text', 'TEXT');
    await addColumn('marketing_campaign', 'scheduled_at', 'TIMESTAMP NULL');
    await addColumn('marketing_campaign', 'sent_at', 'TIMESTAMP NULL');
    await addColumn('marketing_campaign', 'total_recipients', 'INT DEFAULT 0');
    await addColumn('marketing_campaign', 'audience_filter', 'JSON');

    // Other Prisma tables that may have different column names
    console.log('\n--- Other Tables ---');

    // Check orders table
    await addColumn('orders', 'tenant_id', 'VARCHAR(36)');
    await addColumn('orders', 'deleted_at', 'TIMESTAMP NULL');

    // Check interactions table
    await addColumn('interactions', 'tenant_id', 'VARCHAR(36)');

    // Check task_reads table
    await addColumn('task_reads', 'tenant_id', 'VARCHAR(36)');

    // Check task_comments table
    await addColumn('task_comments', 'tenant_id', 'VARCHAR(36)');

    // Check task_history table
    await addColumn('task_history', 'tenant_id', 'VARCHAR(36)');

    console.log('\n✅ Done!');
    c.end();
}

main().catch(console.error);
