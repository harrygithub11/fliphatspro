
// workers/imap-sync.ts
// Run with: npx ts-node --project tsconfig.worker.json workers/imap-sync.ts

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import mysql from 'mysql2/promise';
import { decrypt } from '../lib/smtp-encrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// DB Connection Helper
const connectDB = async () => mysql.createConnection({
    uri: process.env.DATABASE_URL,
    charset: 'utf8mb4'
});

async function syncAccount(account: any) {
    if (!account.imap_host || !account.imap_user || !account.imap_encrypted_password) {
        console.log(`Skipping Account ${account.id}: Missing IMAP config`);
        return;
    }

    let password;
    try {
        password = decrypt(account.imap_encrypted_password);
    } catch (e) {
        console.error(`Decryption failed for IMAP account ${account.id}`, e);
        return;
    }

    const client = new ImapFlow({
        host: account.imap_host,
        port: account.imap_port || 993,
        secure: true,
        auth: {
            user: account.imap_user,
            pass: password
        },
        logger: false as any
    });

    try {
        await client.connect();

        // Select INBOX
        let lock = await client.getMailboxLock('INBOX');
        try {
            // Search for messages since last sync or last 24 hours if null
            // For simplicity, we just fetch UNSEEN or last 50 messages.
            // Better strategy: Store UIDVALIDITY and update `last_synced_at`.

            // Example: Fetch last 10 messages to ensure we have recent history
            // In prod, use '1:*' with standard fetch and check DB for existence.
            const stats = await client.status('INBOX', { messages: true });
            const total = stats.messages || 0;
            const fetchFrom = Math.max(1, total - 20); // Sync last 20 emails for now

            const messageStream = client.fetch(`${fetchFrom}:*`, {
                envelope: true,
                source: true,
                flags: true,
                uid: true
            });

            const db = await connectDB();

            for await (let message of messageStream) {
                try {
                    const parsed = await simpleParser(message.source);

                    // Check if exists
                    const [existing]: any = await db.execute(
                        'SELECT id FROM emails WHERE message_id = ? AND smtp_account_id = ?',
                        [parsed.messageId, account.id]
                    );

                    if (existing.length === 0) {
                        const fromAddr = parsed.from?.value[0];

                        await db.execute(
                            `INSERT INTO emails 
                            (customer_id, smtp_account_id, status, direction, folder, subject, body_html, body_text, 
                            from_name, from_address, recipient_to, message_id, in_reply_to, created_at, is_read)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                null, // customer_id (could lookup later)
                                account.id,
                                'sent', // It's "received" but status column is mostly for outbound. confusing.
                                // Let's rely on 'direction'='inbound'.
                                'inbound',
                                'INBOX',
                                parsed.subject,
                                parsed.html || parsed.textAsHtml,
                                parsed.text,
                                fromAddr?.name || '',
                                fromAddr?.address || '',
                                JSON.stringify(parsed.to?.value || []),
                                parsed.messageId,
                                parsed.inReplyTo,
                                parsed.date || new Date(),
                                false // Unread
                            ]
                        );
                        console.log(`📥 Imported: ${parsed.subject}`);
                    }
                } catch (err) {
                    console.error('Error parsing/saving email:', err);
                }
            }

            await db.end();

        } finally {
            lock.release();
        }

        await client.logout();
    } catch (err: any) {
        console.error(`IMAP Error for ${account.name}:`, err.message);
    }
}

async function run() {
    console.log('🔄 Starting IMAP Sync...');
    const db = await connectDB();
    try {
        const [accounts]: any = await db.execute('SELECT * FROM smtp_accounts WHERE is_active = 1');
        await db.end();

        for (const account of accounts) {
            await syncAccount(account);
        }
    } catch (e) {
        console.error('Sync Error:', e);
        if (db) await db.end();
    }
    console.log('✅ Sync Finished.');
    process.exit(0);
}

run();
