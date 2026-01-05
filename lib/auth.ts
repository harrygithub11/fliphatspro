import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface AdminSession {
    id: number;
    email: string;
    name: string;
    role: string;
}

// Create session token
export async function createSession(admin: AdminSession) {
    const token = await new SignJWT({ admin })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(SECRET_KEY);

    cookies().set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    return token;
}

// Get current admin from session
export async function getSession(): Promise<AdminSession | null> {
    const token = cookies().get('admin_session')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload.admin as AdminSession;
    } catch (error) {
        return null;
    }
}

// Destroy session
export async function destroySession() {
    cookies().delete('admin_session');
}

// Require authentication (use in API routes)
export async function requireAuth(): Promise<AdminSession> {
    const session = await getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}
