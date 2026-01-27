import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// Debug endpoint to check session and lead 3
export async function GET(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            // Get lead 3 info
            const [leads]: any = await connection.execute(
                'SELECT id, name, tenant_id FROM customers WHERE id = 3'
            );

            const lead = leads[0] || null;

            return NextResponse.json({
                success: true,
                debug: {
                    sessionUserId: session.id,
                    sessionTenantId: tenantId,
                    lead3: lead ? {
                        id: lead.id,
                        name: lead.name,
                        tenantId: lead.tenant_id,
                        matches: lead.tenant_id === tenantId
                    } : null
                }
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
