import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// POST - Reset user password
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();

        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { newPassword } = body;

        if (!newPassword || newPassword.length < 8) {
            return NextResponse.json({ success: false, message: 'Password must be at least 8 characters' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Hash new password
            const passwordHash = await bcrypt.hash(newPassword, 10);

            // Update password
            await connection.execute(
                'UPDATE admins SET password_hash = ? WHERE id = ?',
                [passwordHash, params.id]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'password_reset',
                `Reset password for user ID ${params.id}`,
                'admin',
                parseInt(params.id)
            );

            return NextResponse.json({
                success: true,
                message: 'Password reset successfully'
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to reset password' }, { status: 500 });
    }
}
