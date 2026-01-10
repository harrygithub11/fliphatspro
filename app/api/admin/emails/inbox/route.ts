
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const folder = searchParams.get('folder') || 'INBOX'; // INBOX, SENT, TRASH, SPAM
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search') || '';

        let query = `
            SELECT 
                e.id,
                e.subject,
                e.body_text,
                e.received_at,
                e.created_at,
                e.is_read,
                e.from_name,
                e.from_address,
                e.folder,
                e.direction,
                
                c.id as customer_id,
                c.name as customer_name,
                c.email as customer_email,
                c.avatar_url,

                sa.from_email as account_email
            FROM emails e
            LEFT JOIN customers c ON e.customer_id = c.id
            LEFT JOIN smtp_accounts sa ON e.smtp_account_id = sa.id
            WHERE 1=1
        `;

        const params: any[] = [];

        // Folder Filter
        if (folder === 'SENT') {
            query += ` AND e.direction = 'outbound' `;
        } else {
            query += ` AND e.folder = ? `;
            params.push(folder);
        }

        // Search Filter
        if (search) {
            query += ` AND (e.subject LIKE ? OR e.from_name LIKE ? OR e.from_address LIKE ? OR c.name LIKE ?) `;
            const term = `%${search}%`;
            params.push(term, term, term, term);
        }

        query += ` ORDER BY e.received_at DESC, e.created_at DESC LIMIT ?`;
        params.push(limit);

        const [rows]: any = await pool.execute(query, params);

        return NextResponse.json({ success: true, emails: rows });
    } catch (error: any) {
        console.error('Fetch Inbox Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
