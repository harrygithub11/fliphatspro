import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request);
        const stageId = params.id;
        const { searchParams } = new URL(request.url);
        const migrateToId = searchParams.get('migrate_to');

        const connection = await pool.getConnection();

        try {
            // 1. Get the stage details (specifically the value/slug)
            const [stageRows]: any = await connection.execute(
                'SELECT id, value, label, is_active FROM lead_stages WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)',
                [stageId, tenantId]
            );

            if (stageRows.length === 0) {
                return NextResponse.json({ success: false, message: 'Stage not found' }, { status: 404 });
            }
            const sourceStage = stageRows[0];

            // 2. Check Usage Count
            const [usageRows]: any = await connection.execute(
                'SELECT COUNT(*) as count FROM customers WHERE stage = ? AND tenant_id = ? AND deleted_at IS NULL',
                [sourceStage.value, tenantId]
            );
            const usageCount = usageRows[0].count;

            if (usageCount > 0) {
                // If usage exists, require a migration target
                if (!migrateToId) {
                    return NextResponse.json({
                        success: false,
                        message: 'Stage is in use',
                        inUse: true,
                        count: usageCount
                    }, { status: 400 });
                }

                // 3. Validate Migration Target
                const [targetRows]: any = await connection.execute(
                    'SELECT id, value, label FROM lead_stages WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)',
                    [migrateToId, tenantId]
                );

                if (targetRows.length === 0) {
                    return NextResponse.json({ success: false, message: 'Migration target stage not found' }, { status: 400 });
                }
                const targetStage = targetRows[0];

                // 4. Perform Migration
                await connection.execute(
                    'UPDATE customers SET stage = ? WHERE stage = ? AND tenant_id = ?',
                    [targetStage.value, sourceStage.value, tenantId]
                );
            }

            // 5. Delete the Stage
            // Only allow deleting if tenant_id matches (cannot delete system default stages which have null tenant_id usually)
            // But checking previous logic, defaults might have tenant_id matching seeded?
            // Safer: Delete only if it has a tenant_id (custom) OR if we allow deleting defaults (per user request).
            // User query: "delete the custom scrore".
            // Let's check if it's "system" or "custom". 
            // My seed script added tenant_id to defaults. So they look like custom.
            // So we can delete them.

            await connection.execute(
                'DELETE FROM lead_stages WHERE id = ? AND tenant_id = ?',
                [stageId, tenantId]
            );

            return NextResponse.json({ success: true, migrated: usageCount });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete Stage Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete stage' }, { status: 500 });
    }
}
