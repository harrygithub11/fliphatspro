
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all drafts for an account
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        if (!accountId) {
            return NextResponse.json({ success: false, message: 'Account ID required' }, { status: 400 });
        }

        const [rows]: any = await pool.execute(
            'SELECT * FROM email_drafts WHERE smtp_account_id = ? ORDER BY updated_at DESC',
            [accountId]
        );
        return NextResponse.json({ success: true, drafts: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create or update draft
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, smtp_account_id, to, cc, bcc, subject, body_text, body_html } = body;

        if (!smtp_account_id) {
            return NextResponse.json({ success: false, message: 'Account ID required' }, { status: 400 });
        }

        if (id) {
            // Update
            await pool.execute(`
                UPDATE email_drafts 
                SET recipient_to = ?, recipient_cc = ?, recipient_bcc = ?, subject = ?, body_text = ?, body_html = ?
                WHERE id = ? AND smtp_account_id = ?
            `, [to || '', cc || '', bcc || '', subject || '', body_text || '', body_html || '', id, smtp_account_id]);

            return NextResponse.json({ success: true, message: 'Draft saved', id });
        } else {
            // Create
            const [result]: any = await pool.execute(`
                INSERT INTO email_drafts (smtp_account_id, recipient_to, recipient_cc, recipient_bcc, subject, body_text, body_html)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [smtp_account_id, to || '', cc || '', bcc || '', subject || '', body_text || '', body_html || '']);

            return NextResponse.json({ success: true, message: 'Draft created', id: result.insertId });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE draft
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM email_drafts WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Draft deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
