import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

// GET current logged-in admin info
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        // Fetch full admin details from database including dates
        const connection = await pool.getConnection();
        const [rows]: any = await connection.execute(
            'SELECT id, name, email, role, created_at, last_login FROM admins WHERE id = ?',
            [session.id]
        );
        connection.release();

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
        }

        const admin = rows[0];

        return NextResponse.json({
            success: true,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                created_at: admin.created_at,
                last_login: admin.last_login
            }
        });

    } catch (error) {
        console.error("Get Current User Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
