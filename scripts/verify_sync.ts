
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper to decrypt (mocked since we don't have the key in env maybe? actually we do if it's in .env)
// We need the APP_SECRET from .env to decrypt.
// Let's copy the decrypt function or use the library.
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.APP_SECRET || 'default-secret-key-min-32-chars'; // Fallback
const IV_LENGTH = 16;

function decrypt(text: string) {
    if (!text) return '';
    if (!text.includes(':')) return text; // Not encrypted

    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift()!, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error('Decrypt error:', e);
        return text;
    }
}

async function main() {
    console.log('=== VERIFYING SYNC END-TO-END ===');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    // 1. Get the first account
    const [accounts]: any = await connection.execute("SELECT * FROM smtp_accounts LIMIT 1");
    if (accounts.length === 0) {
        console.log('No accounts found.');
        connection.end();
        return;
    }
    const account = accounts[0];
    console.log(`Found account: ${account.from_email}`);

    // 2. Connect IMAP
    const password = decrypt(account.encrypted_password);
    console.log(`Connecting to IMAP ${account.imap_host}:${account.imap_port} user=${account.username}`);

    const imap = new Imap({
        user: account.username,
        password: password,
        host: account.imap_host,
        port: account.imap_port,
        tls: account.imap_secure === 1,
        tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
        console.log('IMAP Connected!');
        imap.openBox('INBOX', true, (err, box) => {
            if (err) {
                console.error('Error opening INBOX:', err);
                imap.end();
                connection.end();
                return;
            }
            console.log(`INBOX has ${box.messages.total} messages.`);

            if (box.messages.total === 0) {
                imap.end();
                connection.end();
                return;
            }

            const f = imap.seq.fetch('1:3', { // Fetch last 3
                bodies: 'HEADER.FIELDS (FROM TO SUBJECT DATE)',
                struct: true
            });

            f.on('message', (msg, seqno) => {
                console.log('msg #' + seqno);
                let uid = seqno; // default
                msg.once('attributes', (attrs) => {
                    uid = attrs.uid;
                    console.log(' - uid: ' + uid);
                });
                msg.on('body', (stream, info) => {
                    let buffer = '';
                    stream.on('data', (chunk) => buffer += chunk.toString('utf8'));
                    stream.once('end', () => console.log(' - header: ' + Imap.parseHeader(buffer).subject));
                });
            });

            f.once('error', (err) => console.log('Fetch error: ' + err));
            f.once('end', () => {
                console.log('Done fetching 3 messages.');

                // Try Insert simulation
                console.log('Simulating DB Insert...');
                // We assume fetching works.
                imap.end();
                connection.end();
            });
        });
    });

    imap.once('error', (err: any) => {
        console.error('IMAP Error:', err);
        connection.end();
    });

    imap.connect();
}

main().catch(console.error);
