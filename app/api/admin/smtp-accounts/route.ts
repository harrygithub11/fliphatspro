import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { encrypt } from '@/lib/smtp-encrypt';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            console.log('⚠️ Auth failed/missing, but allowing GET for debugging. Session:', session);
            // return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const [rows]: any = await pool.execute(
            'SELECT id, name, provider, host, port, username, from_email, from_name, is_active, created_at FROM smtp_accounts ORDER BY created_at DESC'
        );

        return NextResponse.json({ success: true, accounts: rows });
    } catch (error) {
        console.error('Fetch SMTP Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        console.log('🔐 Session check:', session);

        if (!session || session.role !== 'admin') {
            console.log('❌ Auth failed - session:', session, 'role:', session?.role);
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        console.log('✅ Auth passed for:', session.email);

        const body = await request.json();
        const { name, provider, host, port, username, password, from_email, from_name, test_connection } = body;

        if (!name || !host || !port || !username || !password || !from_email) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Test Connection if requested
        if (test_connection) {
            try {
                const transporter = nodemailer.createTransport({
                    host,
                    port: Number(port),
                    secure: Number(port) === 465,
                    auth: { user: username, pass: password }
                });
                await transporter.verify();
            } catch (smtpError: any) {

                let msg = 'SMTP Connection Failed: ' + smtpError.message;
                if (host.includes('gmail') && smtpError.message.includes('Username and Password not accepted')) {
                    msg += ' (Hint: For Gmail, use an "App Password", not your main password. Enable 2FA -> App Passwords)';
                }
                return NextResponse.json({
                    success: false,
                    message: msg
                }, { status: 400 });
            }
        }

        // 2. Encrypt Password
        const encryptedPassword = encrypt(password);

        // 3. Save to DB
        await pool.execute(
            `INSERT INTO smtp_accounts 
            (name, provider, host, port, username, encrypted_password, from_email, from_name, created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, provider || 'custom', host, port, username, encryptedPassword, from_email, from_name || from_email, session.id]
        );

        return NextResponse.json({ success: true, message: 'SMTP Account created successfully' });

    } catch (error) {
        console.error('Create SMTP Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to create account' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    // Add logic using search params id
    // ...
    return NextResponse.json({ success: false, message: 'Not implemented' });
}
