const Imap = require('imap');
const { createDecipheriv, createHash } = require('crypto');

// Decrypt function from smtp-encrypt.ts logic
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || 'default_secret_key_must_be_32_bytes_long!!';
function getKey() {
    return createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
}
function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(getKey()), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Mock DB fetch (hardcoded for test)
const account = {
    user: 'test@fliphatmedia.com', // Replace with username from DB if different
    passwordEncrypted: 'REPLACE_WITH_REAL_ENCRYPTED_PASSWORD',
    host: 'mail.fliphatmedia.com', // Replace with real host
    port: 993,
    tls: true
};

// ... Wait, I need the real credentials to test !! 
// I'll fetch them from DB in the script
const mysql = require('mysql2/promise');

(async () => {
    try {
        console.log('Connecting to DB...');
        const c = await mysql.createConnection({ host: '127.0.0.1', user: 'flipuser', password: 'flippass123', database: 'fliphatspro' });

        // Get the account for ID 3
        const [rows] = await c.execute('SELECT * FROM smtp_accounts WHERE id = 3');
        await c.end();

        if (rows.length === 0) {
            console.error('Account not found');
            return;
        }

        const acct = rows[0];
        console.log('Found account:', acct.from_email);

        let password;
        try {
            password = decrypt(acct.encrypted_password);
            console.log('Password decrypted successfully');
        } catch (e) {
            console.error('Decryption failed:', e.message);
            return;
        }

        const imap = new Imap({
            user: acct.username,
            password: password,
            host: acct.imap_host,
            port: acct.imap_port || 993,
            tls: true,
            tlsOptions: { rejectUnauthorized: false }
        });

        imap.once('ready', () => {
            console.log('IMAP Connected!');
            imap.openBox('INBOX', true, (err, box) => {
                if (err) {
                    console.error('Error opening INBOX:', err);
                    imap.end();
                    return;
                }
                console.log('INBOX opened. Total messages:', box.messages.total);
                imap.end();
            });
        });

        imap.once('error', (err) => {
            console.error('IMAP Error:', err);
        });

        imap.connect();

    } catch (e) {
        console.error('Script error:', e);
    }
})();
