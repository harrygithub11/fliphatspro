import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('=== Comprehensive Database Fix ===');
    console.log('Adding missing columns to all tables...\n');

    // Helper function to add column if it doesn't exist
    const addColumn = async (table: string, column: string, type: string) => {
        try {
            await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
            console.log(`✅ Added ${table}.${column}`);
        } catch (e: any) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log(`⏭️  ${table}.${column} already exists`);
            } else {
                console.log(`❌ Error adding ${table}.${column}: ${e.message}`);
            }
        }
    };

    // ===== TASKS TABLE =====
    console.log('\n--- Tasks Table ---');
    await addColumn('tasks', 'deleted_at', 'TIMESTAMP NULL');
    await addColumn('tasks', 'tenant_id', 'VARCHAR(36)');
    await addColumn('tasks', 'customer_id', 'INT NULL');
    await addColumn('tasks', 'assigned_to', 'INT NULL');
    await addColumn('tasks', 'status_changed_by', 'INT NULL');
    await addColumn('tasks', 'company_id', 'INT NULL');

    // ===== CUSTOMERS TABLE =====
    console.log('\n--- Customers Table ---');
    await addColumn('customers', 'deleted_at', 'TIMESTAMP NULL');
    await addColumn('customers', 'tenant_id', 'VARCHAR(36)');
    await addColumn('customers', 'owner_id', 'INT NULL');
    await addColumn('customers', 'company_id', 'INT NULL');
    await addColumn('customers', 'assigned_to', 'INT NULL');

    // ===== COMPANIES TABLE =====
    console.log('\n--- Companies Table ---');
    await addColumn('companies', 'deleted_at', 'TIMESTAMP NULL');
    await addColumn('companies', 'tenant_id', 'VARCHAR(36)');
    await addColumn('companies', 'owner_id', 'INT NULL');
    await addColumn('companies', 'created_by', 'INT NULL');

    // ===== DEALS TABLE =====
    console.log('\n--- Deals Table ---');
    await addColumn('deals', 'deleted_at', 'TIMESTAMP NULL');
    await addColumn('deals', 'tenant_id', 'VARCHAR(36)');
    await addColumn('deals', 'stage_id', 'INT NULL');
    await addColumn('deals', 'owner_id', 'INT NULL');
    await addColumn('deals', 'created_by', 'INT NULL');

    // ===== ADMINS TABLE =====
    console.log('\n--- Admins Table ---');
    await addColumn('admins', 'tenant_id', 'VARCHAR(36)');
    await addColumn('admins', 'role', 'VARCHAR(50) DEFAULT "admin"');
    await addColumn('admins', 'is_active', 'BOOLEAN DEFAULT TRUE');
    await addColumn('admins', 'avatar_url', 'VARCHAR(500)');

    // ===== NOTIFICATIONS TABLE =====
    console.log('\n--- Notifications Table ---');
    await addColumn('notifications', 'tenant_id', 'VARCHAR(36)');

    // ===== EMAIL RELATED =====
    console.log('\n--- Email Tables ---');
    await addColumn('smtp_accounts', 'tenant_id', 'VARCHAR(36)');
    await addColumn('emails', 'tenant_id', 'VARCHAR(36)');
    await addColumn('marketing_campaigns', 'tenant_id', 'VARCHAR(36)');

    // ===== ACTIVITY LOG =====
    console.log('\n--- Activity Log ---');
    await addColumn('admin_activity_logs', 'tenant_id', 'VARCHAR(36)');

    // ===== LANDING PAGES =====
    console.log('\n--- Landing Pages ---');
    await addColumn('landing_pages', 'tenant_id', 'VARCHAR(36)');

    // ===== LEAD STAGES =====
    console.log('\n--- Lead Stages ---');
    await addColumn('lead_stages', 'tenant_id', 'VARCHAR(36)');

    // ===== LEAD SCORES =====
    console.log('\n--- Lead Scores ---');
    await addColumn('lead_scores', 'tenant_id', 'VARCHAR(36)');

    // ===== MEETINGS =====
    console.log('\n--- Meetings ---');
    await addColumn('meetings', 'tenant_id', 'VARCHAR(36)');

    // ===== FILES =====
    console.log('\n--- Files ---');
    await addColumn('files', 'tenant_id', 'VARCHAR(36)');

    // Now update tenant_id for existing data
    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7';
    console.log('\n--- Updating tenant_id for existing data ---');

    const tablesToUpdate = [
        'tasks', 'customers', 'companies', 'deals', 'admins',
        'notifications', 'smtp_accounts', 'emails', 'marketing_campaigns',
        'admin_activity_logs', 'landing_pages', 'lead_stages', 'lead_scores',
        'meetings', 'files'
    ];

    for (const table of tablesToUpdate) {
        try {
            const [result]: any = await c.execute(
                `UPDATE ${table} SET tenant_id = ? WHERE tenant_id IS NULL`, [tenantId]
            );
            if (result.affectedRows > 0) {
                console.log(`✅ Updated ${result.affectedRows} rows in ${table}`);
            }
        } catch (e: any) {
            // Table might not exist or already updated
        }
    }

    console.log('\n=================================');
    console.log('✅ Database fix complete!');
    console.log('=================================');

    c.end();
}

main().catch(console.error);
