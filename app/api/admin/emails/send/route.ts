import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Reuse Redis connection if possible, or create new for Queue
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const emailQueue = new Queue('email-send-queue', { connection });

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            recipients, // { to: [...], cc: [...], bcc: [...] }
            subject,
            body_html,
            body_text,
            smtp_account_id,
            related_customer_id,
            related_task_id
        } = body;

        // Basic Validation
        if (!recipients?.to || recipients.to.length === 0 || !smtp_account_id) {
            return NextResponse.json({ success: false, message: 'Missing recipients or SMTP account' }, { status: 400 });
        }

        // 1. Insert into Emails Table
        const [result]: any = await pool.execute(
            `INSERT INTO emails 
            (customer_id, user_id, smtp_account_id, status, recipient_to, recipient_cc, recipient_bcc, subject, body_html, body_text, related_task_id) 
            VALUES (?, ?, ?, 'queued', ?, ?, ?, ?, ?, ?, ?)`,
            [
                related_customer_id || null,
                session.id,
                smtp_account_id,
                JSON.stringify(recipients.to),
                JSON.stringify(recipients.cc || []),
                JSON.stringify(recipients.bcc || []),
                subject,
                body_html,
                body_text,
                related_task_id || null
            ]
        );

        const emailId = result.insertId;

        // 2. Add to BullMQ Queue
        await emailQueue.add('send-email', {
            emailId,
            smtpAccountId: smtp_account_id
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Email queued for sending',
            emailId
        });

    } catch (error) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ success: false, message: 'Failed to queue email' }, { status: 500 });
    }
}
