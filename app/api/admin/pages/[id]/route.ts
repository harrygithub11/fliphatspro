import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

// Helper to validate and parse params
async function getContext(params: Promise<{ id: string }>) {
    return params;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { tenantId } = await requireTenantAuth(request);
        const { id } = await getContext(context.params);

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                'SELECT * FROM landing_pages WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            }

            return NextResponse.json(rows[0]);
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message?.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Fetch Page Error:', error);
        return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { id } = await getContext(context.params);
        const body = await request.json();
        const { name, slug, content, is_active, ab_tests } = body;

        // Construct update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (slug) { updates.push('slug = ?'); values.push(slug); }
        if (content) { updates.push('content = ?'); values.push(JSON.stringify(content)); }
        if (typeof is_active !== 'undefined') { updates.push('is_active = ?'); values.push(is_active); }
        if (typeof ab_tests !== 'undefined') { updates.push('ab_tests = ?'); values.push(JSON.stringify(ab_tests)); }

        if (updates.length === 0) {
            return NextResponse.json({ success: true, message: 'No changes made' });
        }

        // Add ID and TenantID to values for WHERE clause
        values.push(id, tenantId);

        const connection = await pool.getConnection();
        try {
            // Check for duplicate slug if slug is changing
            if (slug) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM landing_pages WHERE slug = ? AND id != ? AND tenant_id = ?',
                    [slug, id, tenantId]
                );
                if (existing.length > 0) {
                    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
                }
            }

            const [result]: any = await connection.execute(
                `UPDATE landing_pages SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return NextResponse.json({ error: 'Page not found or access denied' }, { status: 404 });
            }

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'page_update',
                `Updated landing page "${name || 'ID ' + id}"`,
                'landing_page',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message?.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Update Page Error:', error);
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { id } = await getContext(context.params);
        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute('DELETE FROM landing_pages WHERE id = ? AND tenant_id = ?', [id, tenantId]);

            if (result.affectedRows === 0) {
                return NextResponse.json({ error: 'Page not found or access denied' }, { status: 404 });
            }

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'page_delete',
                `Deleted landing page #${id}`,
                'landing_page',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message?.includes('Access denied')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Delete Page Error:', error);
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}
