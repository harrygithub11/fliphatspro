import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET activity logs for current admin
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            const [logs]: any = await connection.execute(
                `SELECT id, action_type, action_description, entity_type, entity_id, created_at 
                 FROM admin_activity_logs 
                 WHERE admin_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 100`,
                [session.id]
            );

            return NextResponse.json(logs);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Activity Logs Error:", error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
