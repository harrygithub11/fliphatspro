
// workers/email-sender.ts
// Run with: npx ts-node --project tsconfig.worker.json workers/email-worker.ts

import { Worker } from 'bullmq';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';
import { decrypt } from '../lib/smtp-encrypt';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
};

async function connectDB() {
    return mysql.createConnection({
        uri: process.env.DATABASE_URL,
        charset: 'utf8mb4'
    });
}

const worker = new Worker('email-queue', async job => {
    console.log(`Processing job ${job.id}: Sending email ID ${job.data.emailId}`);

    const db = await connectDB();
    try {
        // 1. Fetch Email & Account Details (including new signature fields)
        const [rows]: any = await db.execute(`
            SELECT e.*, 
                   sa.host as sa_host, sa.port as sa_port, sa.username as sa_username, sa.encrypted_password as sa_password, sa.from_email as account_email,
                   sa.imap_host, sa.imap_port, sa.imap_secure,
                   sa.signature_text, sa.signature_html, sa.use_signature
            FROM emails e
            JOIN smtp_accounts sa ON e.smtp_account_id = sa.id
            WHERE e.id = ?
        `, [job.data.emailId]);

        if (rows.length === 0) {
            throw new Error(`Email ID ${job.data.emailId} not found`);
        }

        const email = rows[0];

        // 2. Decrypt Password
        let password;
        try {
            password = decrypt(email.sa_password);
        } catch (e) {
            throw new Error(`Failed to decrypt password for account ${email.account_email}`);
        }

        // 3. Apply Signature if enabled
        let finalHtml = email.body_html || '';
        let finalText = email.body_text || '';

        if (email.use_signature) {
            if (email.signature_html) {
                finalHtml = `${finalHtml}<br><br><div class="signature">${email.signature_html}</div>`;
            }
            if (email.signature_text) {
                finalText = `${finalText}\n\n--\n${email.signature_text}`;
            }
        }

        // 4. Create Transporter
        const transporter = nodemailer.createTransport({
            host: email.sa_host,
            port: email.sa_port,
            secure: email.sa_port === 465,
            auth: {
                user: email.sa_username,
                pass: password,
            },
        });

        // 5. Send Mail
        let recipients: any[] = [];
        try {
            recipients = typeof email.recipient_to === 'string' ? JSON.parse(email.recipient_to) : email.recipient_to;
        } catch (e) { recipients = []; }

        const toList = Array.isArray(recipients) ? recipients.map((r: any) => r.email || r).join(', ') : '';
        const firstRecipient = Array.isArray(recipients) ? recipients[0]?.email || recipients[0] : toList;

        // 5b. Generate Tracking Pixel
        const trackingUuid = require('crypto').randomUUID();
        const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/emails/track/open/${trackingUuid}`;

        // Inject pixel at the end of HTML
        if (finalHtml) {
            finalHtml += `<img src="${trackingUrl}" width="1" height="1" style="display:none" alt="" />`;
        }

        const info = await transporter.sendMail({
            from: `"${email.from_name || email.account_email}" <${email.account_email}>`,
            to: toList,
            subject: email.subject,
            text: finalText,
            html: finalHtml,
            inReplyTo: email.in_reply_to,
            references: email.in_reply_to
        });

        console.log(`Message sent via SMTP: ${info.messageId}`);

        // 5c. Log Tracking Record
        await db.execute(`
            INSERT INTO email_tracking (email_id, smtp_account_id, recipient_email, tracking_uuid)
            VALUES (?, ?, ?, ?)
        `, [email.id, email.smtp_account_id, firstRecipient, trackingUuid]);

        // 6. IMAP Append (Save to Sent Folder)
        const { ImapFlow } = await import('imapflow');
        const imapClient = new ImapFlow({
            host: email.imap_host || email.sa_host,
            port: email.imap_port || 993,
            secure: email.imap_secure !== 0,
            auth: {
                user: email.sa_username,
                pass: password
            }
        });

        try {
            await imapClient.connect();
            const folders = await imapClient.list();
            const sentFolder = folders.find(f =>
                f.path.toUpperCase() === 'SENT' ||
                f.path.toUpperCase() === 'INBOX.SENT' ||
                f.path.toUpperCase() === 'SENT ITEMS' ||
                f.name.toUpperCase() === 'SENT'
            );

            if (sentFolder) {
                // Get the RFC822 source for appending
                // Note: nodemailer info doesn't give source directly. We'd ideally regenerate it or fetch from SMTP if supported.
                // For simplicity, we'll use a basic append with the html/text content.
                // ImapFlow append takes a Buffer or String of the FULL RFC822 message.
                // Generating a basic RFC822 message here:
                let rfcMessage = `From: "${email.from_name || email.account_email}" <${email.account_email}>\r\n`;
                rfcMessage += `To: ${toList}\r\n`;
                rfcMessage += `Subject: ${email.subject}\r\n`;
                rfcMessage += `Date: ${new Date().toUTCString()}\r\n`;
                rfcMessage += `Message-ID: <${info.messageId}>\r\n`;
                rfcMessage += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
                rfcMessage += finalHtml;

                await imapClient.append(sentFolder.path, rfcMessage, ['\\Seen']);
                console.log(`Email appended to IMAP folder: ${sentFolder.path}`);
            }
            await imapClient.logout();
        } catch (imapErr: any) {
            console.error('IMAP Append Failed:', imapErr.message);
            // Don't fail the job if just IMAP append fails
        }

        // 7. Update DB & Analytics
        await db.execute(`
            UPDATE emails 
            SET status = 'sent', message_id = ?, sent_at = NOW() 
            WHERE id = ?
        `, [info.messageId, email.id]);

        const today = new Date().toISOString().split('T')[0];
        await db.execute(`
            INSERT INTO email_analytics (smtp_account_id, stat_date, emails_sent)
            VALUES (?, ?, 1)
            ON DUPLICATE KEY UPDATE emails_sent = emails_sent + 1
        `, [email.smtp_account_id, today]);

    } catch (error: any) {
        console.error(`Failed to send email ${job.data.emailId}:`, error);
        await db.execute("UPDATE emails SET status = 'failed' WHERE id = ?", [job.data.emailId]);
        throw error;
    } finally {
        await db.end();
    }
}, { connection });

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});

console.log("Email Sender Worker Started...");
