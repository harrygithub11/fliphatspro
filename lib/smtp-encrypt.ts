import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
// Ensure we have a consistent key. In prod, this should be in .env
// Fallback only for dev convenience if missing, but should warn.
const ENCRYPTION_KEY = process.env.SMTP_ENCRYPTION_KEY || 'default_secret_key_must_be_32_bytes_long!!';

if (process.env.NODE_ENV === 'production' && !process.env.SMTP_ENCRYPTION_KEY) {
    console.warn('WARNING: SMTP_ENCRYPTION_KEY is missing in production!');
}

// Helper to ensure key is 32 bytes
function getKey() {
    return crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest('base64').substring(0, 32);
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getKey()), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getKey()), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
