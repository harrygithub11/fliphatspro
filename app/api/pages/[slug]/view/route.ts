import { NextResponse } from 'next/server';
import pool from '@/lib/db';

async function getContext(params: Promise<{ slug: string }>) {
    return params;
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
    try {
        const { slug } = await getContext(context.params);

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'UPDATE landing_pages SET page_views = page_views + 1 WHERE slug = ?',
                [slug]
            );

            if (result.affectedRows === 0) {
                return NextResponse.json({ error: 'Page not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, message: 'View tracked' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Track View Error:', error);
        return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
    }
}
