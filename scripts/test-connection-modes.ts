
import mysql from 'mysql2/promise';
import { decrypt } from '../lib/smtp-encrypt';
import Imap from 'imap';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const logFile = path.resolve(__dirname, 'test-connection.log');
fs.writeFileSync(logFile, '');

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

function testConnection(config: any, label: string): Promise<boolean> {
    return new Promise((resolve) => {
        log(`\nTesting [${label}] Host: ${config.host}:${config.port} TLS: ${config.tls}...`);

        const imap = new Imap({
            ...config,
            tlsOptions: { rejectUnauthorized: false },
            authTimeout: 10000,
            connTimeout: 10000
        });

        const timer = setTimeout(() => {
            log(`[${label}] Timeout!`);
            imap.destroy();
            resolve(false);
        }, 15000);

        imap.once('ready', () => {
            log(`[${label}] SUCCESS! Connected & Authenticated.`);
            clearTimeout(timer);
            imap.end();
            resolve(true);
        });

        imap.once('error', (err: any) => {
            log(`[${label}] Failed: ${err.message}`);
            clearTimeout(timer);
            resolve(false);
        });

        imap.connect();
    });
}

async function run() {
    let connection;
    try {
        connection = await mysql.createConnection({ uri: process.env.DATABASE_URL });
        const [rows]: any = await connection.execute("SELECT * FROM smtp_accounts WHERE from_email LIKE '%fliphat%' OR from_email LIKE '%test%' LIMIT 1");

        if (rows.length === 0) {
            log("No test account found.");
            return;
        }
        const account = rows[0];
        log(`Account: ${account.from_email}`);

        let password;
        try { password = decrypt(account.encrypted_password); } catch (e) { password = account.encrypted_password; }

        const baseConfig = {
            user: account.username,
            password: password,
            host: account.imap_host || 'imap.hostinger.com',
        };

        // Test 1: Config from DB
        const dbConfig = {
            ...baseConfig,
            port: account.imap_port,
            tls: account.imap_secure === 1 || account.imap_secure === true
        };
        await testConnection(dbConfig, 'DB_SETTINGS');

        // Test 2: Standard SSL
        await testConnection({ ...baseConfig, port: 993, tls: true }, 'FORCE_SSL_993');

        // Test 3: Standard Non-SSL
        await testConnection({ ...baseConfig, port: 143, tls: false }, 'FORCE_NON_SSL_143');

    } catch (e) {
        log(String(e));
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
