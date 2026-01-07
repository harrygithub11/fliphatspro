import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET: Fetch all interactions for global timeline
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                `SELECT i.*, c.name AS customer_name, c.email AS customer_email,
                        a.name AS created_by_name
                 FROM interactions i
                 LEFT JOIN customers c ON i.customer_id = c.id
                 LEFT JOIN admins a ON i.created_by = a.id
                 ORDER BY i.created_at DESC
                 LIMIT ?`,
                [limit]
            );
            return NextResponse.json({ success: true, interactions: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Interactions Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch interactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();

        // Require authentication
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { customer_id, type, content } = body;

        if (!customer_id || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                `INSERT INTO interactions (customer_id, type, content, created_by, created_at) 
                 VALUES (?, ?, ?, ?, NOW())`,
                [customer_id, type || 'internal_note', content, session.id]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'interaction_created',
                `Added ${type || 'note'}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                'customer',
                customer_id
            );

            // Return the created interaction with admin info
            return NextResponse.json({
                success: true,
                interaction: {
                    id: result.insertId,
                    customer_id,
                    type: type || 'internal_note',
                    content,
                    created_by: session.id,
                    created_by_name: session.name,
                    created_at: new Date().toISOString()
                }
            });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Log Interaction Error", error);
        return NextResponse.json({ error: 'Failed to log interaction' }, { status: 500 });
    }
}
