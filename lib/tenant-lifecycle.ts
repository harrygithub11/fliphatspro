
import pool from './db';
import { TenantStatus, TenantPlan } from './tenant-context';

/**
 * Tenant Lifecycle Management
 * 
 * Handles creation, suspension, archival, and deletion of tenants.
 * Also manages data seeding for new tenants.
 */

// ============================================
// STATUS MANAGEMENT
// ============================================

/**
 * Update tenant status (Suspend/Activate/Archive)
 */
export async function updateTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
    const connection = await pool.getConnection();
    try {
        await connection.execute(
            'UPDATE tenants SET status = ? WHERE id = ?',
            [status, tenantId]
        );
    } finally {
        connection.release();
    }
}

// ============================================
// DELETION
// ============================================

/**
 * Hard delete a tenant and ALL associated data
 * CRITICAL: This is irreversible.
 */
export async function deleteTenant(tenantId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Delete all tenant-scoped data from tables
        // Note: Ideally, Foreign Key Cascades should handle most of this if configured correctly.
        // But for safety in a distributed/mixed system, we explicitly clean up major entities.

        const tenantTables = [
            'customers', 'orders', 'products', 'tasks', 'interactions',
            'files', 'project_submissions', 'landing_pages',
            'site_settings', 'emailaccount', 'cachedemail',
            'emaildraft', 'emailtemplate', 'scheduledemail', 'emailthread', 'contact'
        ];

        for (const table of tenantTables) {
            try {
                // Check if table exists and has tenant_id before attempting delete
                // For now, we assume schema is consistent with our migrations
                await connection.execute(`DELETE FROM ${table} WHERE tenant_id = ?`, [tenantId]);
            } catch (error) {
                console.warn(`Failed to cleanup table ${table} for tenant ${tenantId}. It might not exist or lack tenant_id.`, error);
            }
        }

        // 2. Delete tenant users mapping
        await connection.execute('DELETE FROM tenant_users WHERE tenant_id = ?', [tenantId]);

        // 3. Finally, delete the tenant record itself
        await connection.execute('DELETE FROM tenants WHERE id = ?', [tenantId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ============================================
// SEEDING (ON CREATION)
// ============================================

/**
 * Seed default data for a new tenant
 */
export async function seedTenantData(tenantId: string): Promise<void> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Default Lead Stages (Kanban columns)
        const defaultStages = [
            { name: 'New Lead', color: '#3b82f6', order: 0 },
            { name: 'Contacted', color: '#eab308', order: 1 },
            { name: 'Qualified', color: '#22c55e', order: 2 },
            { name: 'Proposal', color: '#a855f7', order: 3 },
            { name: 'Won', color: '#10b981', order: 4 },
            { name: 'Lost', color: '#ef4444', order: 5 }
        ];

        for (const stage of defaultStages) {
            await connection.execute(
                `INSERT INTO lead_stages (tenant_id, name, color, \`order\`) VALUES (?, ?, ?, ?)`,
                [tenantId, stage.name, stage.color, stage.order]
            );
        }

        // 2. Default Site Settings (Theme, etc.)
        await connection.execute(
            `INSERT INTO site_settings (tenant_id, setting_key, setting_value) VALUES (?, 'theme_primary_color', '#3b82f6')`,
            [tenantId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        // Log but don't fail the entire tenant creation if seeding fails partially
        console.error('Failed to seed tenant data:', error);
    } finally {
        connection.release();
    }
}
