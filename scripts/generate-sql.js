
const { createCipheriv, randomBytes } = require('crypto');
require('dotenv').config({ path: '.env' });

const ALGORITHM = 'aes-256-cbc';
const KEY_STRING = process.env.SMTP_ENCRYPTION_KEY || 'default-fallback-key-must-be-32-chars!!';
// Ensure key is 32 bytes
const KEY = Buffer.from(KEY_STRING.padEnd(32, '0').slice(0, 32));

function encrypt(text) {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

const password = 'Mail123!';
const encrypted = encrypt(password);

console.log(`INSERT INTO \`smtp_accounts\` (\`name\`, \`provider\`, \`host\`, \`port\`, \`username\`, \`encrypted_password\`, \`from_email\`, \`from_name\`, \`is_active\`, \`created_at\`, \`updated_at\`, \`created_by\`) VALUES ('test', 'custom', 'mail.connectharish.online', '587', 'noreply@connectharish.online', '${encrypted}', 'noreply@connectharish.online', 'test', 1, NOW(), NOW(), 1);`);
