
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all tasks with customer info
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        let query = `
            SELECT t.*, c.name AS customer_name, c.email AS customer_email
            FROM tasks t
            LEFT JOIN customers c ON t.customer_id = c.id
            WHERE 1=1
        `;
        const params: any[] = [];

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }

        query += ` ORDER BY t.due_date ASC, t.created_at DESC`;

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(query, params);
            return NextResponse.json({ success: true, tasks: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Tasks Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch tasks' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, customer_id, due_date, priority } = body;

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'INSERT INTO tasks (title, customer_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?)',
                [title, customer_id, due_date || null, priority || 'medium', 'open']
            );

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                // Fetch customer name
                const [cust]: any = await connection.execute('SELECT name FROM customers WHERE id = ?', [customer_id]);
                const customerName = cust[0]?.name || 'Unknown';

                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'task_create',
                    `Created task "${title}" for ${customerName}`,
                    'task',
                    result.insertId
                );
            }
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id || Object.keys(updates).length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid update' }, { status: 400 });
        }

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(', ');

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `UPDATE tasks SET ${setClause} WHERE id = ?`,
                [...values, id]
            );

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                const changes = Object.entries(updates)
                    .map(([key, value]) => `${key} to '${value}'`)
                    .join(', ');

                await logAdminActivity(
                    session.id,
                    'task_update',
                    `Updated task #${id}: ${changes}`,
                    'task',
                    id
                );
            }
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update task' }, { status: 500 });
    }
}
