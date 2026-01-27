
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(req);

        // RBAC: Check if user has permission to view emails
        const canViewEmails =
            permissions?.emails?.view === 'all' ||
            permissions?.emails?.view === true ||
            tenantRole === 'owner' ||
            tenantRole === 'admin';

        if (!canViewEmails) {
            return NextResponse.json({
                success: false,
                message: 'You do not have permission to view emails'
            }, { status: 403 });
        }

        const threadId = params.id;

        // User-level isolation: Only show emails from user's own SMTP accounts
        const [rows]: any = await pool.execute(`
            SELECT 
                e.*,
                c.name as customer_name
            FROM emails e
            LEFT JOIN customers c ON e.customer_id = c.id
            WHERE e.thread_id = ? AND e.tenant_id = ?
              AND e.smtp_account_id IN (SELECT id FROM smtp_accounts WHERE created_by = ? AND tenant_id = ?)
            ORDER BY e.created_at ASC
        `, [threadId, tenantId, session.id, tenantId]);

        return NextResponse.json({ success: true, emails: rows });

    } catch (error: any) {
        console.error('Fetch Thread Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
