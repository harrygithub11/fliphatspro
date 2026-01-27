/**
 * Next.js Middleware - FlipHats Platform Router
 * 
 * Routes traffic based on Subdomain:
 * - fliphats.com -> (marketing)
 * - account.fliphats.com -> (account)
 * - crm.fliphats.com -> (apps)/crm
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// ============================================
// CONFIGURATION
// ============================================

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const SESSION_COOKIE_NAME = 'admin_session_v2';
const TENANT_COOKIE_NAME = 'current_tenant_id';

// Subdomains
const ACCOUNT_SUBDOMAIN = 'account';
const APP_SUBDOMAINS = ['crm', 'inventory', 'analytics', 'store']; // Allowed apps

// Routes that don't require authentication on the Account subdomain
const PUBLIC_ACCOUNT_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/accept-invite',
    '/onboarding', // Onboarding might start public or valid session
];

// Routes shared across all subdomains (Legal & Support)
const SHARED_ROUTES = [
    '/privacy',
    '/terms',
    '/contact',
];

// ============================================
// MIDDLEWARE
// ============================================

export async function middleware(request: NextRequest) {
    const { nextUrl } = request;
    const url = nextUrl.clone();
    const hostname = request.headers.get('host') || '';

    // Remove port for localhost handles
    const cleanHostname = hostname.split(':')[0];

    // Determine Subdomain
    let subdomain = '';
    // Check if localhost (including subdomains like crm.localhost)
    const isLocal = cleanHostname.includes('localhost');

    if (isLocal) {
        // Localhost logic
        const parts = cleanHostname.split('.');
        // e.g. localhost -> parts=[localhost] -> no subdomain
        // e.g. crm.localhost -> parts=[crm, localhost] -> subdomain=crm

        if (parts.length > 1) {
            subdomain = parts[0];
        }
    } else {
        // Production / Staging
        const parts = cleanHostname.split('.');
        // account.fliphats.com -> subdomain = account
        if (parts.length > 2) {
            subdomain = parts[0];
        }
    }

    // Skip API routes (handled separately or shared)
    if (url.pathname.startsWith('/api')) {
        // We can add tenant injection header here if needed
        return NextResponse.next();
    }

    // Skip static files
    if (url.pathname.includes('.') || url.pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    // Skip specific shared routes (Legal pages)
    if (SHARED_ROUTES.includes(url.pathname)) {
        return NextResponse.next();
    }

    // --------------------------------------------
    // ROUTING LOGIC
    // --------------------------------------------

    // 0. Safety Redirect: /dashboard should always go to CRM
    // Check if we are NOT ALREADY on the CRM subdomain to avoid infinite loop
    if (url.pathname === '/dashboard' && subdomain !== 'crm') {
        const crmUrl = new URL('/dashboard', request.url);
        if (isLocal) {
            crmUrl.hostname = 'crm.localhost';
        } else {
            const parts = cleanHostname.split('.');
            // replace any existing subdomain or add crm
            if (parts.length > 2) parts[0] = 'crm';
            else parts.unshift('crm');
            crmUrl.hostname = parts.join('.');
        }
        crmUrl.search = url.search; // Preserve search params
        return NextResponse.redirect(crmUrl);
    }

    // 1. Account Subdomain (Auth & Identity)
    if (subdomain === ACCOUNT_SUBDOMAIN) {
        // Rewrite to (account) group
        url.pathname = `/account${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // 2. App Subdomains (CRM, Inventory, etc.)
    if (APP_SUBDOMAINS.includes(subdomain)) {
        // Verify Session
        const session = await verifySession(request);

        if (!session) {
            // unauthorized -> redirect to account login
            const loginUrl = new URL('/login', request.url);
            loginUrl.hostname = isLocal ? `account.localhost` : `account.fliphats.com`;
            if (!isLocal) {
                const hostParts = cleanHostname.split('.');
                hostParts[0] = 'account';
                loginUrl.hostname = hostParts.join('.');
            }
            loginUrl.searchParams.set('redirect', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Extract slug from URL path (first segment)
        const pathParts = url.pathname.split('/').filter(Boolean);
        const urlSlug = pathParts[0];

        // Get tenant context
        let tenantId = request.cookies.get(TENANT_COOKIE_NAME)?.value;
        if (!tenantId && session?.tenantId) {
            tenantId = session.tenantId;
        }

        // Find slug from session tenants
        const sessionTenants = session?.tenants || [];
        const currentTenant = sessionTenants.find((t: any) => t.tenantId === tenantId);
        const expectedSlug = currentTenant?.tenantSlug;

        // If no slug in URL or root path, redirect to slug-prefixed dashboard
        if (!urlSlug || urlSlug === '') {
            if (expectedSlug) {
                const dashboardUrl = new URL(`/${expectedSlug}/dashboard`, request.url);
                dashboardUrl.search = url.search; // Preserve search params
                return NextResponse.redirect(dashboardUrl);
            } else if (!tenantId) {
                // No tenant context, redirect to select tenant
                const selectUrl = new URL('/select-tenant', request.url);
                selectUrl.hostname = isLocal ? 'account.localhost' : 'account.fliphats.com';
                if (!isLocal) {
                    const hostParts = cleanHostname.split('.');
                    hostParts[0] = 'account';
                    selectUrl.hostname = hostParts.join('.');
                }
                return NextResponse.redirect(selectUrl);
            }
        }

        // Validate that URL slug matches a tenant the user has access to
        const matchingTenant = sessionTenants.find((t: any) => t.tenantSlug === urlSlug);
        if (matchingTenant) {
            // Valid slug - rewrite to [slug] route
            url.pathname = `/apps/${subdomain}/${urlSlug}/${pathParts.slice(1).join('/')}`;

            // Set tenant context if different
            const response = NextResponse.rewrite(url);
            if (matchingTenant.tenantId !== tenantId) {
                response.cookies.set(TENANT_COOKIE_NAME, matchingTenant.tenantId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30,
                    path: '/',
                });
            }
            return response;
        }

        // Unknown slug - redirect to dashboard with correct slug
        if (expectedSlug) {
            const dashboardUrl = new URL(`/${expectedSlug}/dashboard`, request.url);
            dashboardUrl.search = url.search; // Preserve search params
            return NextResponse.redirect(dashboardUrl);
        }

        // Fallback: no valid tenant
        const selectUrl = new URL('/select-tenant', request.url);
        selectUrl.hostname = isLocal ? 'account.localhost' : 'account.fliphats.com';
        return NextResponse.redirect(selectUrl);
    }

    // 3. Marketing (Root Domain)
    // Static HTML is now served via next.config.mjs rewrites
    // No rewrite needed here - let it fall through to NextResponse.next()
    if (!subdomain || subdomain === 'www') {
        // Do not rewrite, let next.config.mjs handle static HTML
        return NextResponse.next();
    }

    // Default: allow generic
    return NextResponse.next();
}


// ============================================
// HELPER FUNCTIONS
// ============================================

async function verifySession(request: NextRequest): Promise<any | null> {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload.user || payload.admin || null;
    } catch {
        return null;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
