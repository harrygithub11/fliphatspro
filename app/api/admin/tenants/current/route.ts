/**
 * Current Tenant API
 * 
 * Get and update the current tenant's settings
 */

import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import { getFullTenant } from '@/lib/tenant-context';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tenants/current
 * Get current tenant details
 */
export async function GET(request: Request) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);

        const tenant = await getFullTenant(tenantId);

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({
            tenant: {
                ...tenant,
                role: tenantRole,
            }
        });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error fetching tenant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/tenants/current
 * Update current tenant settings
 */
export async function PATCH(request: Request) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);

        // Only owners and admins can update workspace settings
        if (tenantRole !== 'owner' && tenantRole !== 'admin') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { name, slug, domain } = body;

        const connection = await pool.getConnection();
        try {
            // Check if slug is unique (if changed)
            if (slug) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM tenants WHERE slug = ? AND id != ?',
                    [slug, tenantId]
                );

                if (existing.length > 0) {
                    return NextResponse.json({ error: 'Slug already in use' }, { status: 400 });
                }
            }

            // Update tenant
            const updates: string[] = [];
            const values: any[] = [];

            if (name) {
                updates.push('name = ?');
                values.push(name);
            }
            if (slug) {
                updates.push('slug = ?');
                values.push(slug);
            }
            if (domain !== undefined) {
                updates.push('domain = ?');
                values.push(domain || null);
            }

            if (updates.length > 0) {
                updates.push('updated_at = NOW()');
                values.push(tenantId);

                await connection.execute(
                    `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`,
                    values
                );
            }

            const tenant = await getFullTenant(tenantId);

            return NextResponse.json({
                success: true,
                tenant,
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Error updating tenant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/tenants/current
 * Delete the current tenant (Irreversible)
 */
export async function DELETE(request: Request) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);

        // Only owner can delete the workspace
        if (tenantRole !== 'owner') {
            return NextResponse.json({ error: 'Only the Workspace Owner can delete this workspace' }, { status: 403 });
        }

        const { deleteTenant } = await import('@/lib/tenant-lifecycle');
        await deleteTenant(tenantId);

        // Clear tenant cookie
        const response = NextResponse.json({ success: true });
        response.cookies.delete('current_tenant_id');

        return response;

    } catch (error: any) {
        console.error('Error deleting tenant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
