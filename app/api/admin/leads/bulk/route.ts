/**
 * Bulk Actions API - Multi-Tenant Version
 */

import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(req);

        // Check permissions
        const permissions = session.permissions || {};
        const hasFullAccess = permissions.all === true;
        const canDelete = hasFullAccess || permissions.leads?.delete === 'all' || permissions.leads?.delete === true;
        const canEdit = hasFullAccess || permissions.leads?.edit === 'all' || permissions.leads?.edit === 'owned';

        const body = await req.json();
        const { action, leadIds, data } = body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ success: false, message: 'No leads selected' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const placeholders = leadIds.map(() => '?').join(',');

            if (action === 'delete') {
                if (!canDelete) {
                    return NextResponse.json({ success: false, message: 'No permission to delete leads' }, { status: 403 });
                }

                // SOFT DELETE: Set deleted_at instead of hard delete (compliance)
                await connection.execute(
                    `UPDATE customers SET deleted_at = NOW() WHERE id IN (${placeholders}) AND tenant_id = ? AND deleted_at IS NULL`,
                    [...leadIds, tenantId]
                );

                // Log bulk delete activity
                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'bulk_lead_delete',
                    `Bulk deleted ${leadIds.length} leads`,
                    'customer',
                    0
                );

                return NextResponse.json({ success: true, message: `Deleted ${leadIds.length} leads` });
            }

            if (action === 'add_tags') {
                if (!canEdit) {
                    return NextResponse.json({ success: false, message: 'No permission to edit leads' }, { status: 403 });
                }

                const tagToAdd = data?.tag;
                if (!tagToAdd) return NextResponse.json({ success: false, message: 'Tag is required' }, { status: 400 });

                // Fetch current tags
                const [leads]: any = await connection.execute(
                    `SELECT id, tags FROM customers WHERE id IN (${placeholders}) AND tenant_id = ?`,
                    [...leadIds, tenantId]
                );

                // Update each lead with new tag
                for (const lead of leads) {
                    let currentTags: string[] = [];
                    try {
                        if (typeof lead.tags === 'string' && lead.tags) {
                            currentTags = JSON.parse(lead.tags);
                        }
                    } catch (e) { }

                    if (!Array.isArray(currentTags)) currentTags = [];
                    if (!currentTags.includes(tagToAdd)) {
                        currentTags.push(tagToAdd);
                    }

                    await connection.execute(
                        `UPDATE customers SET tags = ? WHERE id = ? AND tenant_id = ?`,
                        [JSON.stringify(currentTags), lead.id, tenantId]
                    );
                }

                return NextResponse.json({ success: true, message: `Added tag "${tagToAdd}" to ${leads.length} leads` });
            }

            if (action === 'update_status') {
                if (!canEdit) {
                    return NextResponse.json({ success: false, message: 'No permission to edit leads' }, { status: 403 });
                }

                await connection.execute(
                    `UPDATE customers SET stage = ? WHERE id IN (${placeholders}) AND tenant_id = ?`,
                    [data.stage, ...leadIds, tenantId]
                );
                return NextResponse.json({ success: true, message: `Updated status for ${leadIds.length} leads` });
            }

            if (action === 'assign_owner') {
                if (!canEdit) {
                    return NextResponse.json({ success: false, message: 'No permission to edit leads' }, { status: 403 });
                }

                await connection.execute(
                    `UPDATE customers SET owner = ? WHERE id IN (${placeholders}) AND tenant_id = ?`,
                    [data.owner, ...leadIds, tenantId]
                );
                return NextResponse.json({ success: true, message: `Assigned ${leadIds.length} leads to ${data.owner}` });
            }

            if (action === 'update_score') {
                if (!canEdit) {
                    return NextResponse.json({ success: false, message: 'No permission to edit leads' }, { status: 403 });
                }

                await connection.execute(
                    `UPDATE customers SET score = ? WHERE id IN (${placeholders}) AND tenant_id = ?`,
                    [data.score, ...leadIds, tenantId]
                );
                return NextResponse.json({ success: true, message: `Updated score for ${leadIds.length} leads` });
            }

            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        console.error('Bulk action error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
