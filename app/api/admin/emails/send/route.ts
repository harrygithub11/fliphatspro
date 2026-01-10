
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Reuse Redis connection for queue
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const emailQueue = new Queue('email-queue', { connection });

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            recipients, // Expected: { to: [{email: '...'}, ...], cc: [], bcc: [] }
            subject,
            body_html,
            body_text,
            smtp_account_id,
            related_customer_id,
            in_reply_to
        } = body;

        if (!recipients || !recipients.to || !subject || !smtp_account_id) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Sender Info (for from_name/address)
        const [accounts]: any = await pool.execute(
            'SELECT from_name, from_email FROM smtp_accounts WHERE id = ?',
            [smtp_account_id]
        );

        if (accounts.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid SMTP Account' }, { status: 400 });
        }
        const sender = accounts[0];

        // 2. Format Recipients for JSON storage
        const recipientJson = JSON.stringify(recipients.to.map((r: any) => ({
            name: r.name || '',
            email: r.email
        })));

        // 3. Insert into DB (Status = queued)
        // Note: 'folder' is 'SENT' for outbound emails
        // 'direction' is 'outbound'
        const [result]: any = await pool.execute(`
            INSERT INTO emails (
                smtp_account_id, customer_id, direction, folder, status, is_read,
                from_address, from_name, subject, body_html, body_text,
                recipient_to, in_reply_to, created_at
            ) VALUES (?, ?, 'outbound', 'SENT', 'queued', 1, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            smtp_account_id,
            related_customer_id || null,
            sender.from_email,
            sender.from_name || '',
            subject,
            body_html || '',
            body_text || '',
            recipientJson,
            in_reply_to || null
        ]);

        const emailId = result.insertId;

        // 4. Add to BullMQ Queue
        await emailQueue.add('send-email', { emailId });

        return NextResponse.json({ success: true, message: 'Email queued for sending', emailId });

    } catch (error: any) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
