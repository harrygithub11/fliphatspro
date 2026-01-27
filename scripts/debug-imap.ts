
import mysql from 'mysql2/promise';
import { decrypt } from '../lib/smtp-encrypt';
import Imap from 'imap';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function debugImap() {
    const logFile = path.resolve(__dirname, 'debug-imap.log');

    fs.writeFileSync(logFile, '');
    const log = (msg: string) => {
        console.log(msg);
        try { fs.appendFileSync(logFile, msg + '\n'); } catch (e) { }
    };

    let connection;
    try {
        log("Connecting to DB...");
        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error("DATABASE_URL not set");

        connection = await mysql.createConnection({
            uri: dbUrl
        });

        log("Fetching all accounts from 'smtp_accounts'...");
        const [rows]: any = await connection.execute('SELECT * FROM `smtp_accounts`');

        if (rows.length === 0) {
            log("No email accounts found in 'smtp_accounts' table.");
            return;
        }

        log(`Found ${rows.length} accounts.`);

        for (const account of rows) {
            const hasImap = account.imap_host && account.imap_port;
            log(`[ID: ${account.id}] ${account.from_email} -> IMAP: ${account.imap_host}:${account.imap_port} (Valid: ${!!hasImap})`);

            if (hasImap && (account.from_email.includes('fliphat') || account.from_email.includes('test'))) {
                await testAccount(account, log);
            }
        }

    } catch (e: any) {
        log(`Script Error: ${e.message}`);
    } finally {
        if (connection) await connection.end();
    }
}

async function testAccount(account: any, log: any) {
    log(`Testing connection for ${account.from_email}...`);
    return new Promise((resolve) => {
        let password;
        try {
            password = decrypt(account.encrypted_password);
        } catch (e) {
            log(`Failed to decrypt password: ${e}`);
            resolve(false);
            return;
        }

        const imap = new Imap({
            user: account.username,
            password: password,
            host: account.imap_host,
            port: account.imap_port,
            tls: account.imap_secure === 1 || account.imap_secure === true,
            tlsOptions: { rejectUnauthorized: false },
            debug: (msg) => log(`IMAP DEBUG: ${msg}`)
        });

        imap.once('ready', () => {
            log(`IMAP Connected/Authenticated for ${account.from_email}!`);
            imap.openBox('INBOX', true, (err, box) => {
                if (err) log(`Failed to open INBOX: ${err}`);
                else log(`INBOX has ${box.messages.total} messages.`);
                imap.end();
                resolve(true);
            });
        });

        imap.once('error', (err: any) => {
            log(`IMAP Error for ${account.from_email}: ${err}`);
            resolve(false);
        });

        imap.once('end', () => {
            resolve(true);
        });

        imap.connect();
    });
}

debugImap();
