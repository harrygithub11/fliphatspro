import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Get admin from database
            const [rows]: any = await connection.execute(
                'SELECT id, email, name, password_hash, role FROM admins WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
            }

            const admin = rows[0];

            // Verify password with bcrypt
            const isValidPassword = await bcrypt.compare(password, admin.password_hash);

            if (!isValidPassword) {
                return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
            }

            // Update last login
            await connection.execute(
                'UPDATE admins SET last_login = NOW() WHERE id = ?',
                [admin.id]
            );

            // Log successful login
            const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
            const userAgent = request.headers.get('user-agent') || 'unknown';

            try {
                await connection.execute(
                    'INSERT INTO admin_login_logs (admin_id, ip_address, user_agent, login_time, success) VALUES (?, ?, ?, NOW(), TRUE)',
                    [admin.id, ipAddress, userAgent]
                );
            } catch (logError) {
                console.error('Failed to log login:', logError);
                // Continue even if logging fails
            }

            // Create session
            await createSession({
                id: admin.id,
                email: admin.email,
                name: admin.name || admin.email,
                role: admin.role
            });

            return NextResponse.json({
                success: true,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    name: admin.name || admin.email,
                    role: admin.role
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
