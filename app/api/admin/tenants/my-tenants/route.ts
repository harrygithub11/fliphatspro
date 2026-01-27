/**
 * Tenant Management API Routes
 * 
 * Handles tenant listing, switching, and management
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserTenants, setCurrentTenant } from '@/lib/tenant-context';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/tenants/my-tenants
 * Get all tenants the current user belongs to
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenants = await getUserTenants(session.id);

        return NextResponse.json({
            tenants,
            currentTenantId: session.tenantId,
        });
    } catch (error: any) {
        console.error('Error fetching user tenants:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tenants', details: error.message },
            { status: 500 }
        );
    }
}
