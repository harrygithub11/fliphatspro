import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET activity logs for specific user
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getSession();

        if (!session || session.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const connection = await pool.getConnection();

        try {
            const [logs]: any = await connection.execute(
                `SELECT id, action_type, action_description, entity_type, entity_id, created_at 
                 FROM admin_activity_logs 
                 WHERE admin_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 100`,
                [params.id]
            );

            return NextResponse.json(logs);

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch User Activity Logs Error:", error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
