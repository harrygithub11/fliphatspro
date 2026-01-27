import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            // Fetch pages (tenant-scoped)
            const [rows]: any = await connection.execute(
                'SELECT id, slug, name, is_active, page_views, conversions, created_at, updated_at FROM landing_pages WHERE tenant_id = ? ORDER BY created_at DESC',
                [tenantId]
            );
            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fetch Pages Error:', error);
        return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const body = await request.json();
        const { name, slug, content } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Check for duplicate slug within tenant
            const [existing]: any = await connection.execute(
                'SELECT id FROM landing_pages WHERE slug = ? AND tenant_id = ?',
                [slug, tenantId]
            );
            if (existing.length > 0) {
                return NextResponse.json({ error: 'Slug already exists in this workspace' }, { status: 409 });
            }

            const pageContent = content || { settings: {}, hero: {} };

            // Insert with tenant_id
            const [result]: any = await connection.execute(
                'INSERT INTO landing_pages (tenant_id, name, slug, content) VALUES (?, ?, ?, ?)',
                [tenantId, name, slug, JSON.stringify(pageContent)]
            );

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'page_create',
                `Created landing page "${name}" (/sale/${slug})`,
                'landing_page',
                result.insertId
            );

            return NextResponse.json({
                success: true,
                id: result.insertId,
                message: 'Page created successfully'
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Create Page Error:', error);
        return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
    }
}
