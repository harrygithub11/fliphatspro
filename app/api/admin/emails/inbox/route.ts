
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const folder = searchParams.get('folder') || 'INBOX'; // INBOX, SENT, TRASH, SPAM
        const limit = parseInt(searchParams.get('limit') || '50');
        const accountId = searchParams.get('accountId');
        const search = searchParams.get('search') || '';

        // Debug logging for server console
        console.log(`[Inbox API] Fetching folder: ${folder}, Account: ${accountId}, Search: ${search}`);

        let query = `
            SELECT 
                e.id, e.subject, e.body_text, e.received_at, e.created_at, e.is_read,
                e.from_name, e.from_address, e.folder, e.direction, e.recipient_to, e.thread_id,
                e.has_attachments, e.attachment_count,
                (SELECT COUNT(*) FROM emails WHERE thread_id = e.thread_id) as thread_count,
                c.id as customer_id, c.name as customer_name, c.email as customer_email,
                sa.from_email as account_email,
                et.opened_at, et.clicked_at, et.open_count
            FROM emails e
            INNER JOIN (
                SELECT MAX(id) as last_id
                FROM emails
                WHERE 1=1
        `;

        const params: any[] = [];

        if (folder === 'SENT') {
            query += ` AND direction = 'outbound' `;
        } else if (folder !== 'all') {
            query += ` AND folder = ? `;
            params.push(folder);
        }

        if (accountId && accountId !== 'all') {
            query += ` AND smtp_account_id = ? `;
            params.push(parseInt(accountId));
        }

        query += `
                GROUP BY COALESCE(thread_id, CONCAT('single_', id))
            ) t ON e.id = t.last_id
            LEFT JOIN customers c ON e.customer_id = c.id
            LEFT JOIN smtp_accounts sa ON e.smtp_account_id = sa.id
            LEFT JOIN email_tracking et ON e.id = et.email_id
            WHERE 1=1
        `;

        if (search) {
            query += ` AND (e.subject LIKE ? OR e.from_name LIKE ? OR e.from_address LIKE ? OR c.name LIKE ?) `;
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ` ORDER BY e.received_at DESC, e.created_at DESC LIMIT ?`;
        params.push(limit);

        console.log(`[Inbox API] Executing Query: ${query.substring(0, 100)}...`);
        console.log(`[Inbox API] Params:`, params);

        const [rows]: any = await pool.execute(query, params);

        console.log(`[Inbox API] Returned ${rows.length} rows`);

        return NextResponse.json({ success: true, emails: rows, count: rows.length });
    } catch (error: any) {
        console.error('Fetch Inbox Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
