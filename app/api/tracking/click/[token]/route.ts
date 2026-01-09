import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: { token: string } }) {
    const token = params.token;
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('target');

    if (!targetUrl) {
        return new NextResponse('Missing target URL', { status: 400 });
    }

    try {
        const emailId = parseInt(token); // Simplistic token parsing

        if (!isNaN(emailId)) {
            const userAgent = request.headers.get('user-agent') || 'unknown';
            const ip = request.headers.get('x-forwarded-for') || 'unknown';

            // Log Click
            await pool.execute(
                `INSERT INTO email_tracking_events (email_id, type, url, ip_address, user_agent) 
                 VALUES (?, 'click', ?, ?, ?)`,
                [emailId, targetUrl, ip, userAgent]
            );
        }
    } catch (error) {
        console.error('Click Tracking Error:', error);
    }

    // Perform Redirect
    return NextResponse.redirect(targetUrl);
}
