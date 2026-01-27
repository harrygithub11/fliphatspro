
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch full profile details including preferences
export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const connection = await pool.getConnection();

        // 1. Try users table first
        let [rows]: any = await connection.execute(
            'SELECT id, name, email, avatar_url, phone, timezone, language, created_at FROM users WHERE id = ?',
            [session.id]
        );

        // 2. Fallback to admins (legacy)
        if (rows.length === 0) {
            [rows] = await connection.execute(
                'SELECT id, name, email, avatar_url, phone, timezone, "en" as language, created_at, role FROM admins WHERE id = ?',
                [session.id]
            );
        }

        if (rows.length === 0) {
            connection.release();
            return NextResponse.json({ success: false, message: 'Admin not found' }, { status: 404 });
        }

        const admin = rows[0];

        // 2. Fetch Preferences (or use defaults if not exist)
        const [prefRows]: any = await connection.execute(
            'SELECT theme, notify_email, notify_in_app, default_view FROM admin_preferences WHERE admin_id = ?',
            [session.id]
        );

        const preferences = prefRows.length > 0 ? prefRows[0] : {
            theme: 'system',
            notify_email: true,
            notify_in_app: true,
            default_view: 'dashboard'
        };

        connection.release();

        return NextResponse.json({
            success: true,
            user: {
                ...admin,
                role: session.tenantRole || 'member',
                preferences
            }
        });

    } catch (error) {
        console.error("Fetch Profile Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

// PUT: Update profile details & preferences
export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, timezone, language, preferences } = body;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Update Users Table
            if (name || phone || timezone || language) {
                await connection.execute(
                    `UPDATE users 
                     SET name = COALESCE(?, name), 
                         phone = COALESCE(?, phone), 
                         timezone = COALESCE(?, timezone),
                         language = COALESCE(?, language)
                     WHERE id = ?`,
                    [name, phone, timezone, language, session.id]
                );
            }

            // 2. Update/Insert Preferences
            if (preferences) {
                // Upsert preferences
                await connection.execute(
                    `INSERT INTO admin_preferences (admin_id, theme, notify_email, notify_in_app, default_view)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        theme = VALUES(theme),
                        notify_email = VALUES(notify_email),
                        notify_in_app = VALUES(notify_in_app),
                        default_view = VALUES(default_view)`,
                    [
                        session.id,
                        preferences.theme || 'system',
                        preferences.notify_email ?? true,
                        preferences.notify_in_app ?? true,
                        preferences.default_view || 'dashboard'
                    ]
                );
            }

            // 3. Log Activity
            await connection.execute(
                `INSERT INTO admin_activity_log (admin_id, action_type, action_description, ip_address) 
                 VALUES (?, 'update_profile', 'Updated profile information', ?)`,
                [session.id, req.headers.get('x-forwarded-for') || 'unknown']
            );

            await connection.commit();

            return NextResponse.json({ success: true, message: 'Profile updated successfully' });

        } catch (dbError: any) {
            await connection.rollback();
            throw dbError; // rethrow to outer catch
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Update Profile Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
