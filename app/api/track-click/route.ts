import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json(); // or text() if using navigator.sendBeacon
        const { source, url } = typeof body === 'string' ? JSON.parse(body) : body;

        // Log to DB using MySQL
        const connection = await pool.getConnection();
        try {
            // We can use 'landing_pages' view count or a new table 'clicks'. 
            // For simplicity, let's update conversions of the page with that slug/source?
            // Or better, just log interaction.

            // Update landing page conversion count if source matches a page slug
            await connection.execute(
                'UPDATE landing_pages SET conversions = conversions + 1 WHERE slug = ?',
                [source]
            );
        } finally {
            connection.release();
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Track Click Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
