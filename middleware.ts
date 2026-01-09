import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Exclude API routes from middleware - they handle their own auth with JSON responses
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    if (request.nextUrl.pathname.startsWith('/admin')) {
        // Allow public admin routes (login)
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next();
        }

        // Check for session cookie
        const session = request.cookies.get('admin_session')?.value;

        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }

        // Session exists, allow access
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
