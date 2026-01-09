import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const status = searchParams.get('status'); // sent, queued, failed, draft
        const customerId = searchParams.get('customer_id');

        // Build Query
        let query = `
            SELECT e.*, 
                   s.name as smtp_account_name, 
                   s.from_email,
                   c.name as customer_name,
                   c.email as customer_email
            FROM emails e
            LEFT JOIN smtp_accounts s ON e.smtp_account_id = s.id
            LEFT JOIN customers c ON e.customer_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            query += ' AND e.status = ?';
            params.push(status);
        }

        if (customerId) {
            query += ' AND e.customer_id = ?';
            params.push(customerId);
        }

        // Count Total
        const [countRows]: any = await pool.execute(
            `SELECT COUNT(*) as total FROM emails e WHERE 1=1 ${status ? 'AND status = ?' : ''} ${customerId ? 'AND customer_id = ?' : ''}`,
            params
        );
        const total = countRows[0].total;

        // Fetch Data
        query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

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

    } catch (error) {
        console.error('Fetch Emails Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch emails' }, { status: 500 });
    }
}
