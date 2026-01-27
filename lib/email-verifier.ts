import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';


function parseFriendlyError(type: 'SMTP' | 'IMAP', error: any, host: string) {
    const msg = error.message || '';
    const code = error.code || '';
    const response = error.response || '';

    // DNS / Host
    if (code === 'ENOTFOUND' || msg.includes('getaddrinfo ENOTFOUND')) {
        return `Could not reach ${type} server "${host}". Please check the hostname.`;
    }

    // Auth
    if (
        response.includes('535') ||
        msg.includes('Invalid login') ||
        code === 'EAUTH' ||
        (type === 'IMAP' && msg.includes('AUTHENTICATIONFAILED')) ||
        (type === 'IMAP' && response.includes('NO'))
    ) {
        return `Incorrect Username or Password for ${type}. Please verify your credentials.`;
    }

    // Connection
    if (code === 'ETIMEDOUT') {
        return `Connection to ${type} server timed out. Check the Port and SSL settings.`;
    }
    if (code === 'ECONNREFUSED') {
        return `Connection failed. Server refused connection on ${host}. Check the Port number.`;
    }

    // Default
    return `${type} Error: ${msg}`;
}

export async function verifySmtp(config: any) {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        return { success: true };
    } catch (error: any) {
        console.error('[SMTP_VERIFY_FAIL]', error.message);
        return { success: false, error: parseFriendlyError('SMTP', error, config.host) };
    }
}

export async function verifyImap(config: any) {
    const client = new ImapFlow({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.user,
            pass: config.pass,
        },
        tls: {
            rejectUnauthorized: false
        },
        logger: false as any
    });

    try {
        await client.connect();
        await client.logout();
        return { success: true };
    } catch (error: any) {
        console.error('[IMAP_VERIFY_FAIL]', error.message);
        return { success: false, error: parseFriendlyError('IMAP', error, config.host) };
    }
}

