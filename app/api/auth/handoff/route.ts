import { NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'admin_session_v2';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const redirect = searchParams.get('redirect') || '/dashboard';

    if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Prepare response with redirect
    const response = NextResponse.redirect(new URL(redirect, request.url));

    // Set cookie on the current host (e.g. crm.localhost)
    // We intentionally leave 'domain' undefined so it is HostOnly, avoiding localhost sharing issues.
    response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
    });

    return response;
}
