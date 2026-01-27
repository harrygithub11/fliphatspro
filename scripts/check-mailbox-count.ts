
import mysql from 'mysql2/promise';
import { decrypt } from '../lib/smtp-encrypt';
import Imap from 'imap';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function checkMailbox() {
    let connection;
    try {
        connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
        const [rows]: any = await connection.execute("SELECT * FROM smtp_accounts WHERE from_email LIKE '%fliphat%' OR from_email LIKE '%test%' LIMIT 1");

        if (rows.length === 0) {
            console.log("No account found.");
            return;
        }
        const account = rows[0];
        console.log(`Checking mailbox for: ${account.from_email}`);

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
            imap.once('ready', () => {
                console.log('Connected to IMAP');

                imap.openBox('INBOX', true, (err, box) => {
                    if (err) {
                        console.error('Error opening INBOX:', err.message);
                        imap.end();
                        return reject(err);
                    }

                    console.log(`\n📬 INBOX has ${box.messages.total} total emails`);
                    console.log(`   - New (unread): ${box.messages.new}`);

                    imap.end();
                    resolve();
                });
            });
            imap.once('error', (err: any) => {
                console.error('IMAP Error:', err.message);
                reject(err);
            });
            imap.connect();
        });

    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

checkMailbox();
