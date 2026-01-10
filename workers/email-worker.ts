
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
        // 1. Fetch Email & Account Details
        const [rows]: any = await db.execute(`
            SELECT e.*, 
                   sa.host, sa.port, sa.username, sa.encrypted_password, sa.from_email as account_email
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
            password = decrypt(email.encrypted_password);
        } catch (e) {
            throw new Error(`Failed to decrypt password for account ${email.account_email}`);
        }

        // 3. Create Transporter (port-based security: 465 is secure, 587 is STARTTLS)
        const transporter = nodemailer.createTransport({
            host: email.host,
            port: email.port,
            secure: email.port === 465, // true for 465, false for 587
            auth: {
                user: email.username,
                pass: password,
            },
        });

        // 4. Send Mail
        let recipients: any[] = [];
        try {
            if (typeof email.recipient_to === 'string') {
                recipients = JSON.parse(email.recipient_to);
            } else if (Array.isArray(email.recipient_to)) {
                recipients = email.recipient_to;
            } else if (email.recipient_to) {
                // If it's an object but not an array, wrap it
                recipients = [email.recipient_to];
            }
        } catch (e) {
            console.error(`Malformed recipient_to for email ${email.id}:`, email.recipient_to);
            throw new Error(`Invalid recipient data: ${email.recipient_to}`);
        }

        const toList = recipients.map((r: any) => r.email || r).join(', ');

        const info = await transporter.sendMail({
            from: `"${email.from_name || email.account_email}" <${email.account_email}>`,
            to: toList,
            subject: email.subject,
            text: email.body_text,
            html: email.body_html,
            inReplyTo: email.in_reply_to, // Threading
            references: email.in_reply_to // Threading
        });

        console.log(`Message sent: ${info.messageId}`);

        // 5. Update DB Status
        await db.execute(`
            UPDATE emails 
            SET status = 'sent', 
                message_id = ?, 
                sent_at = NOW() 
            WHERE id = ?
        `, [info.messageId, email.id]);

    } catch (error: any) {
        console.error(`Failed to send email ${job.data.emailId}:`, error);

        await db.execute(`
            UPDATE emails 
            SET status = 'failed'
            WHERE id = ?
        `, [job.data.emailId]);

        throw error; // Let BullMQ handle retries
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
