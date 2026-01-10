
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// 1x1 transparent pixel GIF
const PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const trackingUuid = params.id;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const ua = req.headers.get('user-agent') || '';

    try {
        // Log the open event
        await pool.execute(`
            UPDATE email_tracking 
            SET opened_at = IFNULL(opened_at, NOW()), 
                open_count = open_count + 1,
                ip_address = ?,
                user_agent = ?
            WHERE tracking_uuid = ?
        `, [ip, ua, trackingUuid]);

        // Return the transparent pixel
        return new NextResponse(PIXEL, {
            headers: {
                'Content-Type': 'image/gif',
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });
    } catch (error) {
        console.error('Tracking Error:', error);
        // Still return the pixel even if DB log fails to avoid breaking the email
        return new NextResponse(PIXEL, {
            headers: { 'Content-Type': 'image/gif' },
        });
    }
}
