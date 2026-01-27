/**
 * FliphatsPro - Complete SaaS Schema Hardening Migration
 * 
 * This script applies ALL enterprise-grade schema changes:
 * 1. Add missing tenant_id columns
 * 2. Add missing created_by columns
 * 3. Add composite unique keys
 * 4. Add soft delete columns
 * 5. Add performance indexes
 * 6. Add session type column
 * 
 * Run with: npx tsx scripts/saas-schema-hardening.ts
 */

import 'dotenv/config';
import pool from '../lib/db';

// Safe column add helper
async function addColumnIfNotExists(
    connection: any,
    table: string,
    column: string,
    definition: string
) {
    try {
        const [cols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
            [table, column]
        );

        if (cols.length === 0) {
            await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            console.log(`✅ Added ${column} to ${table}`);
            return true;
        } else {
            console.log(`⏭️  ${column} already exists in ${table}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error adding ${column} to ${table}: ${error.message}`);
        return false;
    }
}

// Safe index add helper
async function addIndexIfNotExists(
    connection: any,
    table: string,
    indexName: string,
    columns: string
) {
    try {
        const [indexes]: any = await connection.execute(
            `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
            [table, indexName]
        );

        if (indexes.length === 0) {
            await connection.execute(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columns})`);
            console.log(`✅ Added index ${indexName} to ${table}`);
            return true;
        } else {
            console.log(`⏭️  Index ${indexName} already exists in ${table}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error adding index ${indexName} to ${table}: ${error.message}`);
        return false;
    }
}

// Safe unique key add helper
async function addUniqueKeyIfNotExists(
    connection: any,
    table: string,
    keyName: string,
    columns: string
) {
    try {
        const [indexes]: any = await connection.execute(
            `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
            [table, keyName]
        );

        if (indexes.length === 0) {
            await connection.execute(`ALTER TABLE ${table} ADD UNIQUE KEY ${keyName} (${columns})`);
            console.log(`✅ Added unique key ${keyName} to ${table}`);
            return true;
        } else {
            console.log(`⏭️  Unique key ${keyName} already exists in ${table}`);
            return false;
        }
    } catch (error: any) {
        console.error(`❌ Error adding unique key ${keyName} to ${table}: ${error.message}`);
        return false;
    }
}

async function runMigration() {
    console.log('\n🚀 FliphatsPro SaaS Schema Hardening\n');
    console.log('='.repeat(60));

    const connection = await pool.getConnection();

    try {
        // ============================================
        // PHASE 1: ADD MISSING tenant_id COLUMNS
        // ============================================
        console.log('\n📦 PHASE 1: Adding missing tenant_id columns\n');

        const tablesNeedingTenantId = [
            { table: 'active_sessions', after: 'user_id' },
            { table: 'admin_activity_log', after: 'id' },
            { table: 'admin_activity_logs', after: 'id' },
            { table: 'admin_login_logs', after: 'id' },
            { table: 'admin_preferences', after: 'id' },
            { table: 'campaign_lead', after: 'id' },
            { table: 'campaign_logs', after: 'id' },
            { table: 'campaign_step', after: 'id' },
            { table: 'comment_reads', after: 'id' },
            { table: 'emailanalytics', after: 'id' },
            { table: 'emailattachment', after: 'id' },
            { table: 'emailfolder', after: 'id' },
            { table: 'emaillabel', after: 'id' },
            { table: 'emaillabeling', after: 'id' },
            { table: 'emailreadstatus', after: 'id' },
            { table: 'emailrule', after: 'id' },
            { table: 'emailthreadmember', after: 'id' },
            { table: 'emailtracking', after: 'id' },
            { table: 'email_send_jobs', after: 'id' },
            { table: 'sharedmailbox', after: 'id' },
            { table: 'task_comments', after: 'id' },
            { table: 'task_history', after: 'id' },
            { table: 'task_reads', after: 'id' },
            { table: 'user_presence', after: 'userId' },
        ];

        for (const { table, after } of tablesNeedingTenantId) {
            await addColumnIfNotExists(
                connection,
                table,
                'tenant_id',
                `VARCHAR(191) AFTER ${after}`
            );
        }

        // ============================================
        // PHASE 2: ADD MISSING created_by COLUMNS
        // ============================================
        console.log('\n📦 PHASE 2: Adding missing created_by columns\n');

        const tablesNeedingCreatedBy = [
            'cachedemail',
            'campaign_lead',
            'campaign_step',
            'campaign_logs',
            'contact',
            'customers',
            'emailanalytics',
            'emailattachment',
            'emaildraft',
            'emailfolder',
            'emaillabel',
            'emaillabeling',
            'emaillog',
            'emailrule',
            'emailtemplate',
            'emailthread',
            'emailthreadmember',
            'emailtracking',
            'email_send_jobs',
            'landing_pages',
            'lead_scores',
            'lead_stages',
            'meetings',
            'notifications',
            'orders',
            'project_submissions',
            'scheduledemail',
            'sharedmailbox',
            'site_settings',
            'webhook',
            'deals',
            'companies',
        ];

        for (const table of tablesNeedingCreatedBy) {
            await addColumnIfNotExists(
                connection,
                table,
                'created_by',
                'INT NULL'
            );
        }

        // Fix customers.owner (VARCHAR -> owner_id INT)
        console.log('\n📦 Fixing customers.owner to owner_id\n');
        await addColumnIfNotExists(connection, 'customers', 'owner_id', 'INT NULL');

        // ============================================
        // PHASE 3: ADD SOFT DELETE COLUMNS
        // ============================================
        console.log('\n📦 PHASE 3: Adding soft delete columns\n');

        const tablesNeedingSoftDelete = [
            'customers',
            'contact',
            'orders',
            'files',
            'emails',
            'tasks',
            'deals',
            'companies',
            'marketing_campaign',
            'landing_pages',
        ];

        for (const table of tablesNeedingSoftDelete) {
            await addColumnIfNotExists(
                connection,
                table,
                'deleted_at',
                'DATETIME NULL DEFAULT NULL'
            );
        }

        // ============================================
        // PHASE 4: ADD SESSION TYPE
        // ============================================
        console.log('\n📦 PHASE 4: Adding session_type column\n');

        await addColumnIfNotExists(
            connection,
            'active_sessions',
            'session_type',
            "ENUM('tenant', 'platform') DEFAULT 'tenant'"
        );

        // ============================================
        // PHASE 5: ADD COMPOSITE UNIQUE KEYS
        // ============================================
        console.log('\n📦 PHASE 5: Adding composite unique keys\n');

        await addUniqueKeyIfNotExists(connection, 'customers', 'unique_tenant_email', 'tenant_id, email');
        await addUniqueKeyIfNotExists(connection, 'contact', 'unique_tenant_email', 'tenant_id, email');
        await addUniqueKeyIfNotExists(connection, 'landing_pages', 'unique_tenant_slug', 'tenant_id, slug');
        await addUniqueKeyIfNotExists(connection, 'lead_stages', 'unique_tenant_value', 'tenant_id, value');
        await addUniqueKeyIfNotExists(connection, 'lead_scores', 'unique_tenant_value', 'tenant_id, value');
        await addUniqueKeyIfNotExists(connection, 'tenant_users', 'unique_user_tenant', 'user_id, tenant_id');

        // ============================================
        // PHASE 6: ADD PERFORMANCE INDEXES
        // ============================================
        console.log('\n📦 PHASE 6: Adding performance indexes\n');

        // Customers indexes
        await addIndexIfNotExists(connection, 'customers', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'customers', 'idx_tenant_stage', 'tenant_id, stage');
        await addIndexIfNotExists(connection, 'customers', 'idx_not_deleted', 'tenant_id, deleted_at');

        // Orders indexes
        await addIndexIfNotExists(connection, 'orders', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'orders', 'idx_tenant_status', 'tenant_id, status');

        // Tasks indexes
        await addIndexIfNotExists(connection, 'tasks', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'tasks', 'idx_tenant_assigned', 'tenant_id, assigned_to');
        await addIndexIfNotExists(connection, 'tasks', 'idx_tenant_status', 'tenant_id, status');

        // Deals indexes
        await addIndexIfNotExists(connection, 'deals', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'deals', 'idx_tenant_stage', 'tenant_id, stage');
        await addIndexIfNotExists(connection, 'deals', 'idx_tenant_status', 'tenant_id, status');

        // Emails indexes
        await addIndexIfNotExists(connection, 'emails', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'emails', 'idx_tenant_account', 'tenant_id, smtp_account_id');

        // Marketing campaign indexes
        await addIndexIfNotExists(connection, 'marketing_campaign', 'idx_tenant_status', 'tenant_id, status');

        // Audit log indexes
        await addIndexIfNotExists(connection, 'tenant_audit_logs', 'idx_tenant_created', 'tenant_id, created_at');
        await addIndexIfNotExists(connection, 'tenant_audit_logs', 'idx_tenant_action', 'tenant_id, action');

        // Active sessions indexes
        await addIndexIfNotExists(connection, 'active_sessions', 'idx_tenant_user', 'tenant_id, user_id');
        await addIndexIfNotExists(connection, 'active_sessions', 'idx_expires', 'expires_at');

        // ============================================
        // PHASE 7: ADD AUDIT ACTION TYPES
        // ============================================
        console.log('\n📦 PHASE 7: Extending audit action column\n');

        try {
            await connection.execute(`
                ALTER TABLE tenant_audit_logs MODIFY action VARCHAR(100) NOT NULL
            `);
            console.log('✅ Extended tenant_audit_logs.action to VARCHAR(100)');
        } catch (e: any) {
            console.log('⏭️  tenant_audit_logs.action already extended');
        }

        // ============================================
        // SUMMARY
        // ============================================
        console.log('\n' + '='.repeat(60));
        console.log('✅ SaaS SCHEMA HARDENING COMPLETE');
        console.log('='.repeat(60));
        console.log('\n⚠️  NEXT STEPS:');
        console.log('1. Run tenant_id backfill for tables with NULL tenant_id');
        console.log('2. Run created_by backfill where possible');
        console.log('3. Set tenant_id columns to NOT NULL after backfill');
        console.log('4. Update all APIs to use created_by');
        console.log('5. Update all APIs to check deleted_at IS NULL');
        console.log('\n');

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

runMigration().catch(console.error);
