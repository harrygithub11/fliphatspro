
import { NextResponse } from 'next/server';
import { requirePlatformAdmin, createSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        // Double-check: Only platform admin can do this
        await requirePlatformAdmin();

        const body = await request.json();
        const { tenantId } = body;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // 1. Find the owner of this tenant
            const [tenants]: any = await connection.execute(
                'SELECT owner_id, t.slug FROM tenants t WHERE t.id = ?',
                [tenantId]
            );

            if (tenants.length === 0) {
                return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
            }

            const ownerId = tenants[0].owner_id;
            const tenantSlug = tenants[0].slug;

            // 2. Fetch user details
            const [users]: any = await connection.execute(
                'SELECT id, email, name, role FROM users WHERE id = ?',
                [ownerId]
            );

            if (users.length === 0) {
                return NextResponse.json({ error: 'Tenant owner user not found' }, { status: 404 });
            }

            const user = users[0];

            // 3. Create a session for this user (Impersonation)
            // This sets the cookie on the response
            await createSession({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            });

            // Note: createSession sets the cookie on the global response context in Next.js App Router
            // But sometimes client-side fetch doesn't pick it up automatically for navigation if not handled right.
            // However, Next.js server actions / API routes setting cookies usually adheres.

            return NextResponse.json({ success: true, redirectUrl: `/dashboard` });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Impersonation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
