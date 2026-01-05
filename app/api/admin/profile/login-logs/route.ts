import { NextResponse } from 'next/server';
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
                `SELECT id, ip_address, user_agent, login_time, success 
                 FROM admin_login_logs 
                 WHERE admin_id = ? 
                 ORDER BY login_time DESC 
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
