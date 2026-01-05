import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getContext(params: Promise<{ id: string }>) {
    return params;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        // if (!session || session.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const { id } = await getContext(context.params);
        const connection = await pool.getConnection();

        try {
            // 1. Fetch source page
            const [rows]: any = await connection.execute(
                'SELECT * FROM landing_pages WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Source page not found' }, { status: 404 });
            }

            const sourcePage = rows[0];
            const timestamp = Math.floor(Date.now() / 1000);
            const randomSuffix = Math.random().toString(36).substring(2, 6);

            const newName = `Copy of ${sourcePage.name}`;
            const newSlug = `${sourcePage.slug}-copy-${randomSuffix}`;

            // 2. Insert duplicated page
            // We use JSON.stringify(sourcePage.content) because in DB it's stored as JSON string or handled by driver
            // Actually sourcePage.content might already be an object if mysql2 parsed it, or string.
            const contentValue = typeof sourcePage.content === 'string'
                ? sourcePage.content
                : JSON.stringify(sourcePage.content);

            const [result]: any = await connection.execute(
                'INSERT INTO landing_pages (name, slug, content, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
                [newName, newSlug, contentValue, 0] // Default to Draft (is_active = 0)
            );

            const newId = result.insertId;

            // 3. Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session?.id || 1,
                'page_duplicate',
                `Duplicated page "${sourcePage.name}" as "${newName}"`,
                'landing_page',
                newId
            );

            return NextResponse.json({
                success: true,
                message: 'Page duplicated successfully',
                id: newId,
                name: newName,
                slug: newSlug
            });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Duplicate Page Error:', error);
        return NextResponse.json({ error: 'Failed to duplicate page' }, { status: 500 });
    }
}
