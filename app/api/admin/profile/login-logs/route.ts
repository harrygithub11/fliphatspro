import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET login logs for current admin
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {

            const [logs]: any = await connection.execute(
                `SELECT id, ip_address, user_agent, location, status, created_at as login_time
                 FROM login_history 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [session.id]
            );

            return NextResponse.json(logs);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Login Logs Error:", error);
        return NextResponse.json({ error: 'Failed to fetch login logs' }, { status: 500 });
    }
}
