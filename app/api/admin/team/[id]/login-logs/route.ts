import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET login logs for specific user
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();

        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const connection = await pool.getConnection();

        try {
            const [logs]: any = await connection.execute(
                `SELECT id, ip_address, user_agent, login_time, success 
                 FROM admin_login_logs 
                 WHERE admin_id = ? 
                 ORDER BY login_time DESC 
                 LIMIT 50`,
                [params.id]
            );

            return NextResponse.json(logs);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch User Login Logs Error:", error);
        return NextResponse.json({ error: 'Failed to fetch login logs' }, { status: 500 });
    }
}
