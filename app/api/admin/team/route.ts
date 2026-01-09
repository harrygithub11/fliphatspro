import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET all admins (for assignment dropdowns and team management)
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            const [admins]: any = await connection.execute(
                'SELECT id, name, email, role, avatar_url, created_at, last_login FROM admins ORDER BY name ASC'
            );

            return NextResponse.json(admins);
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Admins Error:", error);
        return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
    }
}

// POST - Create new admin user
export async function POST(request: Request) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only super_admin can create users
        if (session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admins can create users' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, role } = body;

        if (!email || !name || !password) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Check if email already exists
            const [existing]: any = await connection.execute(
                'SELECT id FROM admins WHERE email = ?',
                [email]
            );

            if (existing.length > 0) {
                return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 400 });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 10);

            // Insert new admin
            await connection.execute(
                'INSERT INTO admins (email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
                [email, name, passwordHash, role || 'support']
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'user_created',
                `Created new team member: ${name} (${email})`,
                'admin',
                undefined
            );

            return NextResponse.json({
                success: true,
                message: 'User created successfully'
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Create Admin Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 });
    }
}
