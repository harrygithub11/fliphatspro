
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { encrypt } from '@/lib/smtp-encrypt';

export async function GET() {
    try {
        const [rows] = await pool.execute('SELECT * FROM smtp_accounts ORDER BY id DESC');
        return NextResponse.json({ success: true, accounts: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
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
            // Default to SMTP password if IMAP host is set but no separate password
            encryptedImapPassword = encryptedPassword;
        }

        await pool.execute(
            `INSERT INTO smtp_accounts 
            (name, provider, host, port, username, encrypted_password, from_email, from_name, imap_host, imap_port, imap_user, imap_encrypted_password) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, provider || 'custom', host, port, username, encryptedPassword, from_email, from_name || from_email,
                imap_host, imap_port, imap_user, encryptedImapPassword
            ]
        );

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Create SMTP Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
