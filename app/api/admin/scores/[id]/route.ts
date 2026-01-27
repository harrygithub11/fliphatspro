import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request);
        const scoreId = params.id;
        const { searchParams } = new URL(request.url);
        const migrateToId = searchParams.get('migrate_to');

        const connection = await pool.getConnection();

        try {
            const [scoreRows]: any = await connection.execute(
                'SELECT id, value, label FROM lead_scores WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)',
                [scoreId, tenantId]
            );

            if (scoreRows.length === 0) {
                return NextResponse.json({ success: false, message: 'Score not found' }, { status: 404 });
            }
            const sourceScore = scoreRows[0];

            const [usageRows]: any = await connection.execute(
                'SELECT COUNT(*) as count FROM customers WHERE score = ? AND tenant_id = ? AND deleted_at IS NULL',
                [sourceScore.value, tenantId]
            );
            const usageCount = usageRows[0].count;

            if (usageCount > 0) {
                if (!migrateToId) {
                    return NextResponse.json({
                        success: false,
                        message: 'Score is in use',
                        inUse: true,
                        count: usageCount
                    }, { status: 400 });
                }

                const [targetRows]: any = await connection.execute(
                    'SELECT id, value FROM lead_scores WHERE id = ? AND (tenant_id = ? OR tenant_id IS NULL)',
                    [migrateToId, tenantId]
                );

                if (targetRows.length === 0) {
                    return NextResponse.json({ success: false, message: 'Migration target score not found' }, { status: 400 });
                }
                const targetScore = targetRows[0];

                await connection.execute(
                    'UPDATE customers SET score = ? WHERE score = ? AND tenant_id = ?',
                    [targetScore.value, sourceScore.value, tenantId]
                );
            }

            await connection.execute(
                'DELETE FROM lead_scores WHERE id = ? AND tenant_id = ?',
                [scoreId, tenantId]
            );

            return NextResponse.json({ success: true, migrated: usageCount });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete Score Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete score' }, { status: 500 });
    }
}
