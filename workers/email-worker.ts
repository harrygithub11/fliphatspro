
// workers/email-worker.ts
// Run with: npx ts-node workers/email-worker.ts

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { decrypt } from '../lib/smtp-encrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env specific to where this script is running
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connection = Object.create(null); // Simple cache for DB connection if needed, but we'll use a fresh pool

// DB Pool Init
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10
});

// Redis Connection
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

interface EmailJobData {
    emailId: number;
    smtpAccountId: number;
}

console.log('🚀 Email Worker Started. Waiting for jobs...');

const worker = new Worker('email-send-queue', async (job: Job<EmailJobData>) => {
    const { emailId, smtpAccountId } = job.data;
    console.log(`Processing Job ${job.id}: Email ID ${emailId}, Account ID ${smtpAccountId}`);

    const db = await pool.getConnection();

    try {
        // 1. Fetch Email & SMTP Config
        const [emailRows]: any = await db.execute('SELECT * FROM emails WHERE id = ?', [emailId]);
        const [accountRows]: any = await db.execute('SELECT * FROM smtp_accounts WHERE id = ?', [smtpAccountId]);

        if (emailRows.length === 0 || accountRows.length === 0) {
            throw new Error(`Invalid Email (${emailId}) or Account (${smtpAccountId}) ID`);
        }

        const email = emailRows[0];
        const account = accountRows[0];

        // 2. Decrypt Password
        let password;
        try {
            password = decrypt(account.encrypted_password);
        } catch (e) {
            console.error(`Decryption failed for account ${account.id}`, e);
            throw new Error('Credential decryption failed');
        }

        // 3. Configure Transporter
        const transporter = nodemailer.createTransport({
            host: account.host,
            port: account.port,
            secure: account.port === 465, // true for 465, false for other ports
            auth: {
                user: account.username,
                pass: password
            }
        });

        // 4. Prepare Recipients
        // recipient_to is stored as JSON string in MySQL
        let toAddresses = [];
        try {
            const rawTo = typeof email.recipient_to === 'string' ? JSON.parse(email.recipient_to) : email.recipient_to;
            toAddresses = rawTo.map((r: any) => r.email).join(', ');
        } catch (e) {
            toAddresses = email.recipient_to;
        }

        // 5. Send Mail
        const info = await transporter.sendMail({
            from: `"${account.from_name}" <${account.from_email}>`,
            to: toAddresses,
            subject: email.subject,
            text: email.body_text,
            html: email.body_html,
            // headers: { 'X-Tracking-ID': emailId } // TODO: Add custom headers
        });

        console.log(`✅ Email Sent: ${info.messageId}`);

        // 6. Update Status
        await db.execute(
            'UPDATE emails SET status = ?, sent_at = NOW(), headers_json = ? WHERE id = ?',
            ['sent', JSON.stringify(info), emailId]
        );

        // Optional: Log successful job
        await db.execute(
            'INSERT INTO email_send_jobs (email_id, status, attempt_count, finished_at) VALUES (?, ?, ?, NOW())',
            [emailId, 'completed', job.attemptsMade, new Date()]
        );

    } catch (error: any) {
        console.error(`❌ Job ${job.id} Failed:`, error.message);

        // Update Email Status to Failed (or let retry handle it if likely transient)
        await db.execute(
            'UPDATE emails SET status = ?, error_message = ? WHERE id = ?',
            ['failed', error.message.substring(0, 500), emailId]
        );

        // Log Failure
        await db.execute(
            'INSERT INTO email_send_jobs (email_id, status, attempt_count, last_error, finished_at) VALUES (?, ?, ?, ?, NOW())',
            [emailId, 'failed', job.attemptsMade, error.message.substring(0, 500), new Date()]
        );

        throw error; // Rethrow so BullMQ knows it failed
    } finally {
        db.release();
    }

}, { connection: redisConnection as any });

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
