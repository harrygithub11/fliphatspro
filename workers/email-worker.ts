
// workers/email-worker.ts
// Run with: npx ts-node --project tsconfig.worker.json workers/email-worker.ts

import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { decrypt } from '../lib/smtp-encrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load env specific to where this script is running
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// DB Pool Init
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    charset: 'utf8mb4' // Ensure emojis work
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

    let email: any = null;
    let account: any = null;

    // STEP 1: Fetch Data (Quick DB Access)
    const dbRead = await pool.getConnection();
    try {
        const [emailRows]: any = await dbRead.execute('SELECT * FROM emails WHERE id = ?', [emailId]);
        const [accountRows]: any = await dbRead.execute('SELECT * FROM smtp_accounts WHERE id = ?', [smtpAccountId]);

        if (emailRows.length === 0 || accountRows.length === 0) {
            throw new Error(`Invalid Email (${emailId}) or Account (${smtpAccountId}) ID`);
        }
        email = emailRows[0];
        account = accountRows[0];
    } finally {
        dbRead.release(); // RELEASE IMMEDIATELY
    }

    try {
        // STEP 2: Decrypt (CPU only)
        let password;
        try {
            password = decrypt(account.encrypted_password);
        } catch (e) {
            console.error(`Decryption failed for account ${account.id}`, e);
            throw new Error('Credential decryption failed');
        }

        // STEP 3: Configure Transporter
        const transporter = nodemailer.createTransport({
            host: account.host,
            port: account.port,
            secure: account.port === 465,
            auth: {
                user: account.username,
                pass: password
            }
        });

        // STEP 4: Send Mail (SLOW NETWORK CALL - NO DB CONNECTION HELD)
        let toAddresses = [];
        try {
            const rawTo = typeof email.recipient_to === 'string' ? JSON.parse(email.recipient_to) : email.recipient_to;
            toAddresses = rawTo.map((r: any) => r.email).join(', ');
        } catch (e) {
            toAddresses = email.recipient_to;
        }

        console.log(`Sending email to ${toAddresses}...`);

        const info = await transporter.sendMail({
            from: `"${account.from_name}" <${account.from_email}>`,
            to: toAddresses,
            subject: email.subject,
            text: email.body_text,
            html: email.body_html
        });

        console.log(`✅ Email Sent: ${info.messageId}`);

        // STEP 5: Update Status (Quick DB Access)
        const dbWrite = await pool.getConnection();
        try {
            await dbWrite.execute(
                'UPDATE emails SET status = ?, sent_at = NOW(), headers_json = ? WHERE id = ?',
                ['sent', JSON.stringify(info), emailId]
            );

            await dbWrite.execute(
                'INSERT INTO email_send_jobs (email_id, status, attempt_count, finished_at) VALUES (?, ?, ?, NOW())',
                [emailId, 'completed', job.attemptsMade, new Date()]
            );
        } finally {
            dbWrite.release();
        }

    } catch (error: any) {
        console.error(`❌ Job ${job.id} Failed:`, error.message);

        // Fail Logic (Fresh Connection)
        const dbFail = await pool.getConnection();
        try {
            // Truncate error if too long for DB
            const errorMsg = error.message ? error.message.substring(0, 500) : 'Unknown Error';

            await dbFail.execute(
                'UPDATE emails SET status = ?, error_message = ? WHERE id = ?',
                ['failed', errorMsg, emailId]
            );

            await dbFail.execute(
                'INSERT INTO email_send_jobs (email_id, status, attempt_count, last_error, finished_at) VALUES (?, ?, ?, ?, NOW())',
                [
                    emailId || 0,
                    'failed',
                    Number(job.attemptsMade) || 0,
                    errorMsg,
                    new Date()
                ]
            );
        } catch (dbError) {
            console.error('Failed to log error to DB:', dbError);
        } finally {
            dbFail.release();
        }

        // IMPORTANT: If we successfully sent the email but failed to update status, we DO NOT want to retry (eternal loop)
        // If the error was "Malform packet" (DB error) AFTER send, we should choke the error to stop retry.
        if (error.message.includes('Malformed') || error.message.includes('Packet')) {
            console.error('🛑 Swallowing DB Error to prevent infinite retry loop because email was likely sent.');
            return; // MARK JOB AS DONE (even if DB update failed)
        }

        throw error; // Rethrow for BullMQ
    }

}, {
    connection: redisConnection as any,
    concurrency: 5 // Process 5 jobs at once
});

worker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
