
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { encrypt } from '@/lib/smtp-encrypt';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const {
            name, provider, host, port, username, password,
            from_email, from_name,
            imap_host, imap_port, imap_user, imap_password
        } = body;

        // 1. Basic Validation
        if (!name || !host || !username) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 2. Prepare Update Query
        let query = `UPDATE smtp_accounts SET 
            name = ?, provider = ?, host = ?, port = ?, username = ?, 
            from_email = ?, from_name = ?,
            imap_host = ?, imap_port = ?, imap_user = ?`;

        const queryParams = [
            name, provider, host, port, username,
            from_email, from_name,
            imap_host, imap_port, imap_user
        ];

        // 3. Encrypt & Update SMTP Password only if provided
        if (password && password.trim() !== '') {
            const encryptedPassword = encrypt(password);
            query += `, encrypted_password = ?`;
            queryParams.push(encryptedPassword);
        }

        // 4. Encrypt & Update IMAP Password only if provided
        if (imap_password && imap_password.trim() !== '') {
            const encryptedImapPassword = encrypt(imap_password);
            query += `, imap_encrypted_password = ?`;
            queryParams.push(encryptedImapPassword);
        }

        query += ` WHERE id = ?`;
        queryParams.push(id);

        await pool.execute(query, queryParams);

        // TODO: Test Connection if requested

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update SMTP Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        await pool.execute('DELETE FROM smtp_accounts WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
