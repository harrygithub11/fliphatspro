import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';
import { Queue } from 'bullmq';

// Reuse Redis connection for queue
const emailQueue = new Queue('email-queue', {
    connection: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    }
});

export async function POST(req: NextRequest) {
    try {
        const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(req);

        // RBAC: Check if user has permission to send emails
        const canSendEmails =
            permissions?.emails?.send === true ||
            permissions?.emails?.edit === 'all' ||
            tenantRole === 'owner' ||
            tenantRole === 'admin';

        if (!canSendEmails) {
            return NextResponse.json({
                success: false,
                message: 'You do not have permission to send emails'
            }, { status: 403 });
        }

        const body = await req.json();
        const {
            recipients,
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

        // 1. Get Sender Info (verify belongs to tenant)
        const [accounts]: any = await pool.execute(
            'SELECT from_name, from_email FROM smtp_accounts WHERE id = ? AND tenant_id = ?',
            [smtp_account_id, tenantId]
        );

        if (accounts.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid SMTP Account' }, { status: 400 });
        }
        const sender = accounts[0];

        // 2. Format Recipients
        const recipientJson = JSON.stringify(recipients.to.map((r: any) => ({
            name: r.name || '',
            email: r.email
        })));

        // 3. Threading Logic
        let threadId = `thread_out_${Date.now()}`;
        if (in_reply_to) {
            const [parent]: any = await pool.execute(
                'SELECT thread_id FROM emails WHERE (message_id = ? OR id = ?) AND tenant_id = ?',
                [in_reply_to, in_reply_to, tenantId]
            );
            if (parent.length > 0) threadId = parent[0].thread_id;
        }

        // 4. Insert email with tenant_id
        const [result]: any = await pool.execute(`
            INSERT INTO emails (
                tenant_id, smtp_account_id, customer_id, direction, folder, status, 
                from_address, from_name, subject, body_html, body_text, 
                recipient_to, in_reply_to, thread_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tenantId,
            smtp_account_id,
            related_customer_id || null,
            'outbound',
            'SENT',
            'queued',
            sender.from_email,
            sender.from_name || '',
            subject,
            body_html || '',
            body_text || '',
            recipientJson,
            in_reply_to || null,
            threadId
        ]);

        const emailId = result.insertId;

        // 5. Log as Interaction (for Global Activity/Timeline)
        if (related_customer_id) {
            await pool.execute(`
                INSERT INTO interactions (tenant_id, customer_id, type, content, created_at, created_by)
                VALUES (?, ?, 'email_outbound', ?, NOW(), ?)
            `, [
                tenantId,
                related_customer_id,
                `Email Queued: ${subject.substring(0, 100)}`,
                session.id
            ]);
        }

        // 6. Add to BullMQ Queue
        await emailQueue.add('send-email', { emailId, tenantId });

        return NextResponse.json({ success: true, message: 'Email queued for sending', emailId });

    } catch (error: any) {
        console.error('Send Email Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
