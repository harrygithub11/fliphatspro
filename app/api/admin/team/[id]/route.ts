import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET user details
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super admins can view user details' }, { status: 403 });
        }

        const connection = await pool.getConnection();

        try {
            const [users]: any = await connection.execute(
                'SELECT id, email, name, role, created_at, last_login FROM admins WHERE id = ?',
                [params.id]
            );

            if (users.length === 0) {
                return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, user: users[0] });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Get User Error:", error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PATCH - Update user role
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();

        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { role } = body;

        if (!role || !['super_admin', 'support'].includes(role)) {
            return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            await connection.execute(
                'UPDATE admins SET role = ? WHERE id = ?',
                [role, params.id]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'role_changed',
                `Changed user role to ${role}`,
                'admin',
                parseInt(params.id)
            );

            return NextResponse.json({ success: true, message: 'Role updated successfully' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Update Role Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update role' }, { status: 500 });
    }
}
