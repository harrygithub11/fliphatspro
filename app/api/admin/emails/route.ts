import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(request);

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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const status = searchParams.get('status');
        const customerId = searchParams.get('customer_id');

        // User-level isolation: Only show emails from user's own SMTP accounts
        let query = `
            SELECT e.*, 
                   s.name as smtp_account_name, 
                   s.from_email,
                   c.name as customer_name,
                   c.email as customer_email
            FROM emails e
            LEFT JOIN smtp_accounts s ON e.smtp_account_id = s.id
            LEFT JOIN customers c ON e.customer_id = c.id
            WHERE e.tenant_id = ?
              AND e.smtp_account_id IN (SELECT id FROM smtp_accounts WHERE created_by = ? AND tenant_id = ?)
        `;
        const params: any[] = [tenantId, session.id, tenantId];

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (customerId) {
            query += ' AND e.customer_id = ?';
            params.push(customerId);
        }

        // Count Total (tenant-scoped)
        const countParams = [...params];
        const [countRows]: any = await pool.execute(
            `SELECT COUNT(*) as total FROM emails e WHERE e.tenant_id = ? ${status ? 'AND e.status = ?' : ''} ${customerId ? 'AND e.customer_id = ?' : ''}`,
            countParams
        );
        const total = countRows[0].total;

        // Fetch Data
        query += ` ORDER BY e.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

        const [rows]: any = await pool.execute(query, params);

        return NextResponse.json({
            success: true,
            emails: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Fetch Emails Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Server Error: ' + error.message
        }, { status: 500 });
    }
}
