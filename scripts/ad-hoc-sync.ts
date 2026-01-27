
import mysql from 'mysql2/promise';
import { decrypt } from '../lib/smtp-encrypt';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logFile = path.resolve(__dirname, 'sync-debug.log');
fs.writeFileSync(logFile, '');

const log = (msg: string) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

async function syncFolder(imap: any, accountId: string, folderName: string, limit: number = 25): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const emails: any[] = []
        const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 45000)

        imap.openBox(folderName, true, (err: any, box: any) => {
            if (err) {
                clearTimeout(timeout)
                log(`[SYNC_${folderName}] Error opening box: ${err.message}`)
                return resolve([])
            }

            const total = box.messages.total
            log(`[SYNC_${folderName}] ${total} messages`)

            if (total === 0) {
                clearTimeout(timeout)
                return resolve([])
            }

            const fetchCount = Math.min(limit, total)
            const start = Math.max(1, total - fetchCount + 1)
            const fetch = imap.seq.fetch(`${start}:${total}`, { bodies: '', struct: true })

            let expectedMessages = 0
            let parsedMessages = 0
            let fetchEnded = false

            const checkComplete = () => {
                if (fetchEnded && parsedMessages === expectedMessages) {
                    clearTimeout(timeout)
                    resolve(emails)
                }
            }

            fetch.on('message', (msg: any, seqno: number) => {
                expectedMessages++
                msg.on('body', (stream: any) => {
                    simpleParser(stream as Readable, (parseErr: any, parsed: any) => {
                        parsedMessages++
                        if (!parseErr && parsed) {
                            const fromText = parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown'
                            const toText = parsed.to?.text || parsed.to?.value?.[0]?.address || ''
                            // We will rely on simpleParser fields.
                            // Note: parsed.to can be object or array or undefined. 'toText' is a string representation.
                            // We'll use 'parsed.to' if available for better JSON structure, or just stick to 'toText' and sanitize later?
                            // Previously we used 'toText'. Let's stick to 'parsed.to' if we want real JSON.

                            emails.push({
                                uid: seqno,
                                folder: folderName,
                                from: fromText.substring(0, 255),
                                to: parsed.to || toText, // Pass full object if possible
                                subject: (parsed.subject || '(No Subject)').substring(0, 500),
                                textSnippet: (parsed.text || '').substring(0, 1000),
                                htmlContent: parsed.html || null,
                                date: parsed.date || new Date(),
                                attachmentCount: parsed.attachments?.length || 0,
                            })
                        }
                        checkComplete()
                    })
                })
            })

            fetch.once('end', () => {
                fetchEnded = true;
                checkComplete()
            })

            fetch.once('error', (err: any) => resolve([]))
        })
    })
}

// Helper to ensure valid JSON for recipients
const sanitizeRecipient = (recip: any) => {
    if (!recip) return JSON.stringify([]);
    if (typeof recip === 'string') {
        return JSON.stringify([{ address: recip, name: '' }]);
    }
    if (Array.isArray(recip)) return JSON.stringify(recip);
    if (recip && typeof recip === 'object') return JSON.stringify([recip]);
    return JSON.stringify([]);
}

async function runSync() {
    let connection: mysql.Connection | undefined;
    try {
        connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
        const [rows]: any = await connection.execute("SELECT * FROM smtp_accounts WHERE from_email LIKE '%fliphat%' OR from_email LIKE '%test%' LIMIT 1");

        if (rows.length === 0) {
            log("No account found.");
            return;
        }
        const account = rows[0];
        log(`Syncing Account: ${account.from_email} (ID: ${account.id})`);

        let password;
        try { password = decrypt(account.encrypted_password); } catch (e) { password = account.encrypted_password; }

        const imap = new Imap({
            user: account.username,
            password: password,
            host: account.imap_host,
            port: account.imap_port,
            tls: account.imap_secure === 1,
            tlsOptions: { rejectUnauthorized: false }
        });

        await new Promise<void>((resolve, reject) => {
            imap.once('ready', async () => {
                log('IMAP Connected');
                try {
                    const inbox = await syncFolder(imap, String(account.id), 'INBOX', 20);
                    log(`Fetched ${inbox.length} inbox emails.`);

                    let sent: any[] = [];
                    try {
                        sent = await syncFolder(imap, String(account.id), 'Sent', 20);
                    } catch (e) {
                        log('Sent folder failed, trying INBOX.Sent');
                        try { sent = await syncFolder(imap, String(account.id), 'INBOX.Sent', 20); } catch (e2) { log('INBOX.Sent failed'); }
                    }
                    log(`Fetched ${sent.length} sent emails.`);

                    const all = [...inbox, ...sent];
                    if (all.length > 0) {
                        const values: any[] = []
                        // Matches route.ts schema update: from_name, from_address, recipient_to(JSON)
                        const placeholders = all.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')

                        all.forEach(e => {
                            values.push(
                                account.tenant_id,
                                account.created_by,
                                account.id,
                                e.uid,
                                e.folder,
                                String(e.from).substring(0, 255), // from_name
                                String(e.from).substring(0, 255), // from_address
                                sanitizeRecipient(e.to), // recipient_to (JSON)
                                e.body_text || e.textSnippet, // handle mapping 
                                e.htmlContent,
                                e.date,
                                e.attachmentCount,
                                e.subject
                            )
                        });

                        // IMPORTANT: Need to match placeholders count. 13 placeholders.
                        // tenant, user, smtp, uid, folder, from_name, from_addr, recip, text, html, date, attach, subject

                        // NOTE: debug-schema said columns were: ... from_name, from_address, recipient_to ... subject ... body_text ...
                        // The order in INSERT must match VALUES order.

                        await connection!.execute(`
                            INSERT INTO emails 
                            (tenant_id, user_id, smtp_account_id, uid, folder, from_name, from_address, recipient_to, body_text, body_html, received_at, attachment_count, subject)
                            VALUES ${placeholders}
                            ON DUPLICATE KEY UPDATE 
                            received_at = VALUES(received_at),
                            from_name = VALUES(from_name),
                            recipient_to = VALUES(recipient_to)
                        `, values);

                        log('Saved to DB.');
                    }

                    await connection!.execute("UPDATE smtp_accounts SET last_sync = NOW() WHERE id = ?", [account.id]);
                    log('Updated last_sync.');
                    imap.end();
                    resolve();
                } catch (e) { reject(e); }
            });
            imap.once('error', reject);
            imap.connect();
        });

    } catch (e: any) {
        log(`Run Error: ${e.message}`);
        console.error(e);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

runSync();
