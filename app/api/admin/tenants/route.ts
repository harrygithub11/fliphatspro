/**
 * Tenants API
 * 
 * Create new tenants (workspaces)
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createTenant } from '@/lib/tenant-context';
import { seedTenantData } from '@/lib/tenant-lifecycle';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/tenants
 * Create a new tenant (workspace)
 */
export async function POST(request: Request) {
    try {
        const session = await requireAuth();

        const body = await request.json();
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json(
                { error: 'Name and slug are required' },
                { status: 400 }
            );
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json(
                { error: 'Slug must contain only lowercase letters, numbers, and hyphens' },
                { status: 400 }
            );
        }

        // Check if slug is unique
        const connection = await pool.getConnection();
        try {
            const [existing]: any = await connection.execute(
                'SELECT id FROM tenants WHERE slug = ?',
                [slug]
            );

            if (existing.length > 0) {
                return NextResponse.json(
                    { error: 'This workspace URL is already taken' },
                    { status: 400 }
                );
            }

            // Create the tenant
            const tenant = await createTenant(name, slug, session.id, 'free');

            // Seed default data
            await seedTenantData(tenant.id);

            return NextResponse.json({
                success: true,
                tenant,
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Error creating tenant:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * GET /api/admin/tenants
 * List all tenants (platform admin only)
 */
export async function GET(request: Request) {
    try {
        const session = await requireAuth();

        // Only platform admins can list all tenants
        if (!session.isPlatformAdmin) {
            return NextResponse.json({ error: 'Platform admin access required' }, { status: 403 });
        }

        const connection = await pool.getConnection();
        try {
            const [tenants]: any = await connection.execute(`
                SELECT 
                    t.*,
                    COUNT(DISTINCT tu.user_id) as user_count,
                    COUNT(DISTINCT c.id) as customer_count
                FROM tenants t
                LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
                LEFT JOIN customers c ON t.id = c.tenant_id
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `);

            return NextResponse.json({ tenants });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Error listing tenants:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
