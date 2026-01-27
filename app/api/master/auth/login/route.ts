import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // 1. Find the user
            const [users]: any = await connection.execute(
                'SELECT u.id, u.email, u.password_hash, u.name FROM users u WHERE u.email = ?',
                [email]
            );

            if (users.length === 0) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const user = users[0];

            // 2. Verify password
            // Use dynamic import to avoid ESM/CJS interop issues in Next.js
            const bcrypt = await import('bcryptjs');
            const isValid = await bcrypt.compare(password, user.password_hash);

            if (!isValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // 3. !! CRITICAL !! Check if user is a Platform Admin
            const [admins]: any = await connection.execute(
                'SELECT role FROM platform_admins WHERE user_id = ?',
                [user.id]
            );

            if (admins.length === 0) {
                // User exists but is NOT a platform admin - ACCESS DENIED
                return NextResponse.json({
                    error: 'Access Denied. You are not a Platform Administrator.'
                }, { status: 403 });
            }

            // 4. Create session (this sets the cookie)
            await createSession({
                id: user.id,
                email: user.email,
                name: user.name,
                role: admins[0].role // Use platform role
            });

            return NextResponse.json({ success: true });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Master Login Error:', error);
        return NextResponse.json({
            error: `Authentication failed: ${error.message}`,
            details: JSON.stringify(error)
        }, { status: 500 });
    }
}
