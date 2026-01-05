import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const fs = require('fs');
        const session = await getSession();

        fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] GET /api/admin/pages - Session: ${JSON.stringify(session)}\n`);

        // if (!session || session.role !== 'admin') {
        //     fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Unauthorized access attempt\n`);
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const connection = await pool.getConnection();
        try {
            // Fetch summary of pages
            const [rows]: any = await connection.execute(
                'SELECT id, slug, name, is_active, page_views, conversions, created_at, updated_at FROM landing_pages ORDER BY created_at DESC'
            );
            fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] Fetched ${rows.length} pages\n`);
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
        const session = await getSession();
        // if (!session || session.role !== 'admin') {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const body = await request.json();
        const { name, slug, content } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Check for duplicate slug
            const [existing]: any = await connection.execute('SELECT id FROM landing_pages WHERE slug = ?', [slug]);
            if (existing.length > 0) {
                return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
            }

            // Default content if not provided
            const pageContent = content || { settings: {}, hero: {} };

            // Insert new page
            const [result]: any = await connection.execute(
                'INSERT INTO landing_pages (name, slug, content) VALUES (?, ?, ?)',
                [name, slug, JSON.stringify(pageContent)]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session?.id || 1, // Fallback ID for internal debug
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
