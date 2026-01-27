
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'admin_session_v2';
const TENANT_COOKIE_NAME = 'current_tenant_id';

export async function POST(request: Request) {
    try {
        const cookieStore = cookies();

        // Delete session cookie
        cookieStore.delete(SESSION_COOKIE_NAME);

        // Delete tenant context cookie
        cookieStore.delete(TENANT_COOKIE_NAME);

        // Check referer to determine where to redirect
        const referer = request.headers.get('referer') || '';
        const isMasterRoute = referer.includes('/master');

        // Redirect to appropriate login page
        const redirectUrl = isMasterRoute ? '/master/login' : '/login';

        return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

// Also support GET for direct navigation
export async function GET(request: Request) {
    return POST(request);
}
