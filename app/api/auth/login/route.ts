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
            // 1. Find the user in both users table and legacy admins table
            let [users]: any = await connection.execute(
                'SELECT id, email, password_hash, name FROM users WHERE email = ?',
                [email]
            );

            // Fallback to admins table for backward compatibility
            if (users.length === 0) {
                [users] = await connection.execute(
                    'SELECT id, email, password_hash, name, role FROM admins WHERE email = ?',
                    [email]
                );
            }

            if (users.length === 0) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            const user = users[0];

            // 2. Verify password
            const bcrypt = await import('bcryptjs');
            const isValid = await bcrypt.compare(password, user.password_hash);
            if (!isValid) {
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }

            // 3. Create session (includes tenant context)
            const token = await createSession({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'member' // Default role for users table logic
            }, {
                ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
                userAgent: request.headers.get('user-agent') || 'Unknown Device'
            });

            // 4. Update last login
            await connection.execute(
                'UPDATE users SET last_login = NOW() WHERE id = ?',
                [user.id]
            ).catch(() => { });

            // 5. Log activity & history
            const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
            const userAgent = request.headers.get('user-agent') || 'Unknown Device';

            // Log to login_history
            await connection.execute(
                `INSERT INTO login_history (user_id, email, ip_address, user_agent, status, created_at) 
                 VALUES (?, ?, ?, ?, 'success', NOW())`,
                [user.id, email, ip, userAgent]
            ).catch((err: any) => console.error("Login History Error:", err));

            // Legacy Audit Log
            await connection.execute(
                `INSERT INTO tenant_audit_logs (user_id, action, ip_address, created_at) 
                 VALUES (?, 'Login', ?, NOW())`,
                [user.id, ip]
            ).catch((err: any) => console.error("Log Error:", err));

            return NextResponse.json({ success: true, token });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Login Error:', error);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}
