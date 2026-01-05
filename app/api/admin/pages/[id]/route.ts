import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// Helper to validate and parse params
async function getContext(params: Promise<{ id: string }>) {
    return params;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        // if (!session || session.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { id } = await getContext(context.params);
        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                'SELECT * FROM landing_pages WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            }

            // Clean up JSON content (db returns it as string sometimes depending on driver, but mysql2 usually handles it)
            // If it needs parsing, we can check. usually mysql2/promise with JSON column types handles it.

            return NextResponse.json(rows[0]);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fetch Page Error:', error);
        return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        // if (!session || session.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { id } = await getContext(context.params);
        const body = await request.json();
        const { name, slug, content, is_active } = body;

        // Construct update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (name) { updates.push('name = ?'); values.push(name); }
        if (slug) { updates.push('slug = ?'); values.push(slug); }
        if (content) { updates.push('content = ?'); values.push(JSON.stringify(content)); }
        if (typeof is_active !== 'undefined') { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length === 0) {
            return NextResponse.json({ success: true, message: 'No changes made' });
        }

        // Add ID to values for WHERE clause
        values.push(id);

        const connection = await pool.getConnection();
        try {
            // Check for duplicate slug if slug is changing
            if (slug) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM landing_pages WHERE slug = ? AND id != ?',
                    [slug, id]
                );
                if (existing.length > 0) {
                    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
                }
            }

            await connection.execute(
                `UPDATE landing_pages SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session?.id || 1,
                'page_update',
                `Updated landing page "${name || 'ID ' + id}"`,
                'landing_page',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update Page Error:', error);
        return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        // if (!session || session.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { id } = await getContext(context.params);
        const connection = await pool.getConnection();
        try {
            await connection.execute('DELETE FROM landing_pages WHERE id = ?', [id]);

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session?.id || 1,
                'page_delete',
                `Deleted landing page #${id}`,
                'landing_page',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Delete Page Error:', error);
        return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
    }
}
