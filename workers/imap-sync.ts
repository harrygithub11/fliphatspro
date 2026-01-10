
// workers/imap-sync.ts
// Run with: npx ts-node --project tsconfig.worker.json workers/imap-sync.ts

import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import path from 'path';
import { decrypt } from '../lib/smtp-encrypt';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SYNC_INTERVAL_MS = 60000; // Check every 1 minute

async function connectDB() {
    return mysql.createConnection({
        uri: process.env.DATABASE_URL,
        charset: 'utf8mb4'
    });
}

async function syncAccount(account: any) {
    console.log(`Checking ${account.from_email} (${account.imap_host})...`);

    let db;
    let client: ImapFlow | null = null;

    try {
        let password;
        try {
            password = decrypt(account.imap_encrypted_password || account.encrypted_password);
        } catch (e) {
            console.error(`Failed to decrypt password for ${account.from_email}`);
            return;
        }

        // Simple Logger for ImapFlow
        const logger = {
            debug: (obj: any, msg?: string) => console.log(`[IMAP DEBUG] ${msg || ''}`, JSON.stringify(obj)),
            info: (obj: any, msg?: string) => console.log(`[IMAP INFO] ${msg || ''}`, JSON.stringify(obj)),
            warn: (obj: any, msg?: string) => console.warn(`[IMAP WARN] ${msg || ''}`, JSON.stringify(obj)),
            error: (obj: any, msg?: string) => console.error(`[IMAP ERROR] ${msg || ''}`, JSON.stringify(obj)),
            level: 'debug'
        };

        const host = (account.imap_host || account.host).trim();
        const user = (account.imap_user || account.username).trim();

        console.log(`Connecting to ${host}:${account.imap_port || 993} as ${user}`);

        client = new ImapFlow({
            host: host,
            port: account.imap_port || 993,
            secure: account.imap_secure !== 0,
            auth: {
                user: user,
                pass: password
            },
            logger: logger as any
        });

        await client.connect();

        // Open Inbox
        let lock = await client.getMailboxLock('INBOX');
        try {
            // Fetch unread messages
            // We can also track last_synced_at UIDnext to get new messages efficiently
            // For now, let's just get UNSEEN
            for await (const message of client.fetch('UNSEEN', { source: true, envelope: true })) {
                if (!message.source) continue;

                const parsed = await simpleParser(message.source);
                const db = await connectDB();

                // Check if email already exists (by messageId)
                const messageId = parsed.messageId || `no-id-${Date.now()}`;
                const [existing]: any = await db.execute('SELECT id FROM emails WHERE message_id = ?', [messageId]);

                if (existing.length > 0) {
                    // Already exists, maybe just update read status?
                    // For now skip
                    await db.end();
                    continue;
                }

                // Determine Folder (Inbox)
                // Find Customer (by from address)
                const fromAddress = parsed.from?.value[0]?.address;
                const [customers]: any = await db.execute('SELECT id FROM customers WHERE email = ?', [fromAddress]);
                const customerId = customers.length > 0 ? customers[0].id : null;

                console.log(`Creating email from ${fromAddress} - ${parsed.subject}`);

                const [result]: any = await db.execute(`
                    INSERT INTO emails (
                        smtp_account_id, customer_id, direction, folder, status, is_read,
                        from_address, from_name, subject, body_html, body_text, 
                        received_at, message_id, headers_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
                `, [
                    account.id,
                    customerId,
                    'inbound',
                    'INBOX',
                    'received',
                    false, // is_read = false
                    fromAddress,
                    parsed.from?.value[0]?.name || '',
                    parsed.subject,
                    parsed.html || '',
                    parsed.text || '',
                    messageId,
                    JSON.stringify(parsed.headers)
                ]);

                // Mark as Seen in IMAP? Optional, maybe keep as is or user pref.
                // await client.messageFlagsAdd(message.uid, ['\\Seen']);

                await db.end();
            }
        } finally {
            lock.release();
        }

        await client.logout();

        // Update last synced
        db = await connectDB();
        await db.execute('UPDATE smtp_accounts SET last_synced_at = NOW() WHERE id = ?', [account.id]);

    } catch (e: any) {
        console.error(`Error syncing ${account.from_email}:`, e);
        if (e.command) console.error("Failed Command:", e.command);
        if (e.response) console.error("Server Response:", e.response);
    } finally {
        if (db) await db.end();
        if (client) client.close();
    }
}

async function runSync() {
    console.log("Starting Sync Poll...");
    let db;
    try {
        db = await connectDB();
        // Fetch accounts that have IMAP configured
        const [accounts]: any = await db.execute(
            'SELECT * FROM smtp_accounts WHERE is_active = 1 AND imap_host IS NOT NULL'
        );

        console.log(`Found ${accounts.length} accounts to sync.`);

        for (const account of accounts) {
            await syncAccount(account);
        }

    } catch (e) {
        console.error("Sync Loop Error:", e);
    } finally {
        if (db) await db.end();
    }

    console.log(`Sync finished. Sleeping for ${SYNC_INTERVAL_MS / 1000}s...`);
    setTimeout(runSync, SYNC_INTERVAL_MS);
}

runSync();
