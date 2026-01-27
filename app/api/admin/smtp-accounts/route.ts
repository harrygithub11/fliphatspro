import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';
import { encrypt } from '@/lib/smtp-encrypt';

export async function GET(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        console.log(`[SMTP API] Fetching accounts for user: ${session.id} in tenant: ${tenantId}`);

        // User-level isolation: only show SMTP accounts created by this user
        const [rows] = await pool.execute(`
            SELECT sa.*,
                   (SELECT COUNT(*) FROM emails WHERE smtp_account_id = sa.id AND folder = 'INBOX' AND is_read = 0) as unread_count
            FROM smtp_accounts sa
            WHERE sa.tenant_id = ? AND sa.created_by = ?
            ORDER BY sa.id DESC
        `, [tenantId, session.id]);

        return NextResponse.json({ success: true, accounts: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { session, tenantId } = await requireTenantAuth(req);

        const body = await req.json();
        const {
            name, provider, host, port, username, password,
            from_email, from_name,
            imap_host, imap_port, imap_user, imap_password
        } = body;

        if (!name || !host || !username || !password) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const encryptedPassword = encrypt(password);

        let encryptedImapPassword = null;
        if (imap_password) {
            encryptedImapPassword = encrypt(imap_password);
        } else if (imap_host) {
            encryptedImapPassword = encryptedPassword;
        }

        // User-level isolation: Set created_by to current user
        await pool.execute(
            `INSERT INTO smtp_accounts 
            (tenant_id, created_by, name, provider, host, port, username, encrypted_password, from_email, from_name, imap_host, imap_port, imap_user, imap_encrypted_password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                tenantId, session.id, name, provider || 'custom', host, port, username, encryptedPassword, from_email, from_name || from_email,
                imap_host, imap_port, imap_user, encryptedImapPassword
            ]
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Create SMTP Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
