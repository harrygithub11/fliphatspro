
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createTenant } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
    const connection = await pool.getConnection();
    const results = [];

    try {
        await connection.beginTransaction();

        // 1. Check if we have a default tenant, create if not
        let defaultTenantId;
        const [tenants]: any = await connection.execute("SELECT id FROM tenants WHERE slug = 'default'");

        if (tenants.length > 0) {
            defaultTenantId = tenants[0].id;
            results.push(`Using existing default tenant: ${defaultTenantId}`);
        } else {
            // Find the first admin/user to own the default tenant
            const [users]: any = await connection.execute("SELECT id, name, email FROM users ORDER BY created_at ASC LIMIT 1");
            let ownerId;

            if (users.length > 0) {
                ownerId = users[0].id;
                results.push(`Found owner: ${users[0].email}`);
            } else {
                // If no users, we can't create a valid tenant easily without an owner.
                // But for migration sake, let's look in 'admins' table too (legacy)
                const [admins]: any = await connection.execute("SELECT id FROM admins ORDER BY created_at ASC LIMIT 1");
                if (admins.length > 0) {
                    ownerId = admins[0].id;
                    results.push(`Found legacy owner: ${ownerId}`);
                }
            }

            if (!ownerId) {
                return NextResponse.json({ error: "No users found to assign as tenant owner. Please register a user first." });
            }

            // Create 'Default Workspace'
            // We use the library function but we need to pass connection... 
            // actually createTenant uses pool, so we can't wrap it in this transaction easily without refactoring.
            // Let's do raw SQL here for safety and atomicity.

            defaultTenantId = crypto.randomUUID();
            await connection.execute(
                `INSERT INTO tenants (id, name, slug, plan, owner_id, status, created_at, updated_at)
                 VALUES (?, 'Default Workspace', 'default', 'professional', ?, 'active', NOW(), NOW())`,
                [defaultTenantId, ownerId]
            );

            // Add subscription
            await connection.execute(
                `INSERT INTO subscriptions (id, company_id, plan, status, start_date, created_at, updated_at)
                 VALUES (UUID(), ?, 'professional', 'active', NOW(), NOW(), NOW())`,
                [defaultTenantId]
            );

            results.push(`Created default tenant: ${defaultTenantId}`);
        }

        // 2. Assign all orphaned data to this tenant
        const tablesToMigrate = [
            'customers', 'orders', 'tasks', 'files', 'interactions',
            'landing_pages', 'lead_stages', 'lead_scores', 'site_settings',
            'emailaccount', 'emaillog', 'cachedemail', 'emaildraft', 'emailtemplate',
            'scheduledemail', 'contact', 'flash_messages'
        ];

        for (const table of tablesToMigrate) {
            try {
                // Check if table exists and has tenant_id column
                // (Skip strict check for speed, just try-catch the update)
                const [res]: any = await connection.execute(
                    `UPDATE ${table} SET tenant_id = ? WHERE tenant_id IS NULL`,
                    [defaultTenantId]
                );
                if (res.affectedRows > 0) {
                    results.push(`Migrated ${res.affectedRows} rows in ${table}`);
                }
            } catch (e: any) {
                // Ignore missing table errors or column errors
                // results.push(`Skipped ${table}: ${e.message}`); 
                // Only log real errors
                if (!e.message.includes("doesn't exist") && !e.message.includes("Unknown column")) {
                    results.push(`Error updating ${table}: ${e.message}`);
                }
            }
        }

        // 3. Ensure all users are members of this tenant
        const [allUsers]: any = await connection.execute("SELECT id FROM users");
        for (const u of allUsers) {
            // Check existence
            const [exists]: any = await connection.execute(
                "SELECT 1 FROM tenant_users WHERE tenant_id = ? AND user_id = ?",
                [defaultTenantId, u.id]
            );

            if (exists.length === 0) {
                // Get owner to decide role
                const [t]: any = await connection.execute("SELECT owner_id FROM tenants WHERE id = ?", [defaultTenantId]);
                const role = (t[0].owner_id === u.id) ? 'owner' : 'admin';

                // Insert
                await connection.execute(
                    `INSERT INTO tenant_users (tenant_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())`,
                    [defaultTenantId, u.id, role]
                );
                results.push(`Added user ${u.id} to tenant as ${role}`);
            }
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: "Migration completed successfully", logs: results });

    } catch (error: any) {
        await connection.rollback();
        console.error("Migration Failed:", error);
        return NextResponse.json({ success: false, error: error.message, logs: results }, { status: 500 });
    } finally {
        connection.release();
    }
}
