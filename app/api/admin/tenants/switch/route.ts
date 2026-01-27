/**
 * Tenant Switch API
 * 
 * Allows users to switch between tenants they belong to
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, createSession } from '@/lib/auth';
import { getUserTenantRole, setCurrentTenant } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/tenants/switch
 * Switch to a different tenant
 */
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId } = body;

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Tenant ID is required' },
                { status: 400 }
            );
        }

        // Verify user has access to this tenant
        const tenantRole = await getUserTenantRole(session.id, tenantId);

        if (!tenantRole) {
            return NextResponse.json(
                { error: 'Access denied to this tenant' },
                { status: 403 }
            );
        }

        // Set the current tenant in cookie
        setCurrentTenant(tenantId);

        // Recreate session with updated tenant context
        const token = await createSession({
            id: session.id,
            email: session.email,
            name: session.name,
            role: session.role,
        });

        return NextResponse.json({
            success: true,
            tenantId,
            tenantRole,
            token,
        });
    } catch (error: any) {
        console.error('Error switching tenant:', error);
        return NextResponse.json(
            { error: 'Failed to switch tenant', details: error.message },
            { status: 500 }
        );
    }
}
