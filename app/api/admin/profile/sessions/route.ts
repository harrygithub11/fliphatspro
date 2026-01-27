
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await requireAuth();

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                `SELECT id, ip_address, user_agent, created_at, last_active, is_revoked,
                        (session_token = ?) as is_current
                 FROM active_sessions 
                 WHERE user_id = ? AND expires_at > NOW() AND is_revoked = FALSE 
                 ORDER BY last_active DESC`,
                [session.jti || '', session.id] // Note: We don't have access to the current JWT here easily to mark "is_current" without extracting it again.
            );

            // To mark "current session", we need the JTI from the current token.
            // requireAuth returns the session payload, but not the raw token or JTI directly unless we update session type.
            // However, we can just return the list. The frontend can't easily know which one is "current" by JTI unless we send JTI in session.

            return NextResponse.json({ success: true, sessions: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await requireAuth();
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('id');
        const revokeAll = searchParams.get('all') === 'true';

        const connection = await pool.getConnection();
        try {
            if (revokeAll) {
                // Revoke all EXCEPT current? We don't know "current" easily here without JTI.
                // For "Log Out All Other Devices", we need to know current JTI.
                // Let's implement specific deletion first.
                await connection.execute(
                    'UPDATE active_sessions SET is_revoked = TRUE WHERE user_id = ?',
                    [session.id]
                );
            } else if (sessionId) {
                await connection.execute(
                    'UPDATE active_sessions SET is_revoked = TRUE WHERE id = ? AND user_id = ?',
                    [sessionId, session.id]
                );
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to revoke session' }, { status: 500 });
    }
}
