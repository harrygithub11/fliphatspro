
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

async function syncFolder(client: ImapFlow, db: any, account: any, folderName: string) {
    console.log(`[SYNC] Syncing folder: ${folderName} for ${account.from_email}`);

    let lock;
    try {
        lock = await client.getMailboxLock(folderName);

        // Search for recent messages. We'll fetch the last 50 for now to avoid overloading.
        // In the Sent folder, we don't necessarily look for 'unseen'.
        const searchCriteria = folderName === 'INBOX' ? { seen: false } : { all: true };
        const messagesToFetch = await client.search(searchCriteria);

        if (messagesToFetch && messagesToFetch.length > 0) {
            // Take the last 50 if there are many
            const recentUids = messagesToFetch.slice(-50);
            console.log(`[${folderName}] Found ${messagesToFetch.length} messages, syncing ${recentUids.length} most recent.`);

            for await (const message of client.fetch(recentUids, { source: true, envelope: true, uid: true, flags: true })) {
                if (!message.source) continue;

                try {
                    const parsed = await simpleParser(message.source);
                    const messageId = parsed.messageId || `no-id-${Date.now()}-${Math.random()}`;

                    // Check if already exists
                    const [existing]: any = await db.execute('SELECT id FROM emails WHERE message_id = ?', [messageId]);
                    if (existing.length > 0) {
                        if (folderName === 'INBOX') {
                            await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
                        }
                        continue;
                    }

                    // Determine Direction and Folder
                    const direction = folderName.toLowerCase().includes('sent') ? 'outbound' : 'inbound';

                    // Determine Customer
                    const fromAddress = parsed.from?.value[0]?.address;
                    const toAddress = parsed.to && (Array.isArray(parsed.to) ? parsed.to[0]?.value[0]?.address : (parsed.to as any).value[0]?.address);

                    const lookupEmail = direction === 'inbound' ? fromAddress : toAddress;
                    const [customers]: any = await db.execute('SELECT id FROM customers WHERE email = ?', [lookupEmail]);
                    const customerId = customers.length > 0 ? customers[0].id : null;

                    // Parse 'To' field
                    const recipientTo = Array.isArray(parsed.to)
                        ? (parsed.to as any).map((t: any) => t.value).flat()
                        : (parsed.to?.value || []);

                    const recipientToJson = JSON.stringify(recipientTo.map((r: any) => ({
                        name: r.name || '',
                        email: r.address
                    })));

                    // Attachments logic
                    const hasAttachments = parsed.attachments && parsed.attachments.length > 0;
                    const attachmentCount = parsed.attachments?.length || 0;

                    // Threading Logic
                    let threadId = `thread_${messageId}`;
                    const inReplyTo = parsed.inReplyTo || '';

                    if (inReplyTo) {
                        const [parent]: any = await db.execute('SELECT thread_id FROM emails WHERE message_id = ?', [inReplyTo]);
                        if (parent.length > 0) threadId = parent[0].thread_id;
                    } else {
                        const cleanSubject = (parsed.subject || '').replace(/^Re:\s+/i, '').trim();
                        if (cleanSubject && customerId) {
                            const [match]: any = await db.execute(
                                'SELECT thread_id FROM emails WHERE customer_id = ? AND (subject LIKE ? OR subject = ?) ORDER BY created_at DESC LIMIT 1',
                                [customerId, `Re: ${cleanSubject}`, cleanSubject]
                            );
                            if (match.length > 0) threadId = match[0].thread_id;
                        }
                    }

                    const receivedAt = parsed.date || new Date();

                    await db.execute(`
                        INSERT INTO emails (
                            smtp_account_id, customer_id, direction, folder, status, is_read,
                            from_address, from_name, subject, body_html, body_text, 
                            received_at, message_id, in_reply_to, thread_id, headers_json, recipient_to,
                            has_attachments, attachment_count
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        account.id,
                        customerId,
                        direction,
                        folderName,
                        direction === 'inbound' ? 'received' : 'sent',
                        folderName === 'INBOX' ? false : true,
                        fromAddress,
                        parsed.from?.value[0]?.name || '',
                        parsed.subject,
                        parsed.html || '',
                        parsed.text || '',
                        receivedAt,
                        messageId,
                        inReplyTo,
                        threadId,
                        JSON.stringify(parsed.headers),
                        recipientToJson,
                        hasAttachments,
                        attachmentCount
                    ]);

                    // Log Interaction
                    if (customerId) {
                        const interactionType = direction === 'inbound' ? 'email_inbound' : 'email_outbound';
                        await db.execute(`
                            INSERT INTO interactions (customer_id, type, content, created_at, created_by)
                            VALUES (?, ?, ?, NOW(), NULL)
                        `, [
                            customerId,
                            interactionType,
                            `${direction === 'inbound' ? 'Received' : 'Sent'} Email: ${parsed.subject?.substring(0, 100)}`
                        ]);
                    }

                    if (folderName === 'INBOX') {
                        await client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
                    }

                } catch (err) {
                    console.error(`Failed to process message in ${folderName}:`, err);
                }
            }
        }
    } catch (e: any) {
        console.error(`Error syncing folder ${folderName}:`, e.message);
    } finally {
        if (lock) lock.release();
    }
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

        const host = (account.imap_host || account.host).trim();
        const user = (account.imap_user || account.username).trim();

        client = new ImapFlow({
            host: host,
            port: account.imap_port || 993,
            secure: account.imap_secure !== 0,
            auth: {
                user: user,
                pass: password
            }
        });

        await client.connect();
        db = await connectDB();

        // 1. Sync INBOX
        await syncFolder(client, db, account, 'INBOX');

        // 2. Sync Sent
        // Try different common names for Sent folder
        const folders = await client.list();
        const sentFolder = folders.find(f =>
            f.path.toUpperCase() === 'SENT' ||
            f.path.toUpperCase() === 'INBOX.SENT' ||
            f.path.toUpperCase() === 'SENT ITEMS' ||
            f.name.toUpperCase() === 'SENT'
        );

        if (sentFolder) {
            await syncFolder(client, db, account, sentFolder.path);
        }

        await client.logout();
        await db.execute('UPDATE smtp_accounts SET last_synced_at = NOW() WHERE id = ?', [account.id]);

    } catch (e: any) {
        console.error(`Error syncing account ${account.from_email}:`, e);
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
