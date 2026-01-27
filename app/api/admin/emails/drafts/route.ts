import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all drafts for an account (tenant-scoped)
export async function GET(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');

        if (!accountId) {
            return NextResponse.json({ success: false, message: 'Account ID required' }, { status: 400 });
        }

        const [rows]: any = await pool.execute(
            'SELECT * FROM email_drafts WHERE smtp_account_id = ? AND tenant_id = ? ORDER BY updated_at DESC',
            [accountId, tenantId]
        );
        return NextResponse.json({ success: true, drafts: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create or update draft (tenant-scoped)
export async function POST(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const body = await req.json();
        const { id, smtp_account_id, to, cc, bcc, subject, body_text, body_html } = body;

        if (!smtp_account_id) {
            return NextResponse.json({ success: false, message: 'Account ID required' }, { status: 400 });
        }

        if (id) {
            // Update with tenant check
            await pool.execute(`
                UPDATE email_drafts 
                SET recipient_to = ?, recipient_cc = ?, recipient_bcc = ?, subject = ?, body_text = ?, body_html = ?
                WHERE id = ? AND smtp_account_id = ? AND tenant_id = ?
            `, [to || '', cc || '', bcc || '', subject || '', body_text || '', body_html || '', id, smtp_account_id, tenantId]);

            return NextResponse.json({ success: true, message: 'Draft saved', id });
        } else {
            // Create with tenant_id
            const [result]: any = await pool.execute(`
                INSERT INTO email_drafts (tenant_id, smtp_account_id, recipient_to, recipient_cc, recipient_bcc, subject, body_text, body_html)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [tenantId, smtp_account_id, to || '', cc || '', bcc || '', subject || '', body_text || '', body_html || '']);

            return NextResponse.json({ success: true, message: 'Draft created', id: result.insertId });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE draft (tenant-scoped)
export async function DELETE(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM email_drafts WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        return NextResponse.json({ success: true, message: 'Draft deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
