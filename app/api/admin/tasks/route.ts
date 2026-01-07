
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET: Fetch all tasks with customer info
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const createdBy = searchParams.get('created_by');

        let query = `
            SELECT t.*, c.name AS customer_name, c.email AS customer_email, 
                   a.name AS created_by_name,
                   asg.name AS assigned_name,
                   sc.name AS status_changed_by_name
            FROM tasks t
            LEFT JOIN customers c ON t.customer_id = c.id
            LEFT JOIN admins a ON t.created_by = a.id
            LEFT JOIN admins asg ON t.assigned_to = asg.id
            LEFT JOIN admins sc ON t.status_changed_by = sc.id
            WHERE 1 = 1
        `;
        const params: any[] = [];

        if (status) {
            query += ` AND t.status = ? `;
            params.push(status);
        }
        if (priority) {
            query += ` AND t.priority = ? `;
            params.push(priority);
        }
        if (createdBy && createdBy !== 'all') {
            query += ` AND t.created_by = ? `;
            params.push(createdBy);
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
        const { title, customer_id, due_date, priority, assigned_to } = body;

        const { getSession } = await import('@/lib/auth');
        const session = await getSession();
        const createdBy = session ? session.id : null;

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'INSERT INTO tasks (title, customer_id, due_date, priority, status, created_by, assigned_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, customer_id, due_date || null, priority || 'medium', 'open', createdBy, assigned_to || null]
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

        const connection = await pool.getConnection();
        try {
            // If status is being updated, also track who changed it
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();

            if (updates.status && session) {
                updates.status_changed_by = session.id;
                updates.status_changed_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
            }

            const keys = Object.keys(updates);
            const values = Object.values(updates);
            const setClause = keys.map(k => `${k} = ?`).join(', ');

            await connection.execute(
                `UPDATE tasks SET ${setClause} WHERE id = ?`,
                [...values, id]
            );

            // Log Admin Activity
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                const changes = Object.entries(updates)
                    .map(([key, value]) => `${key} to '${value}'`)
                    .join(', ');

                await logAdminActivity(
                    session.id,
                    'task_update',
                    `Updated task #${id}: ${changes} `,
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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Task ID required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Get task info before deleting for logging
            const [taskRows]: any = await connection.execute('SELECT title FROM tasks WHERE id = ?', [id]);
            const taskTitle = taskRows[0]?.title || 'Unknown';

            await connection.execute('DELETE FROM tasks WHERE id = ?', [id]);

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'task_delete',
                    `Deleted task "${taskTitle}"`,
                    'task',
                    parseInt(id)
                );
            }
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to delete task' }, { status: 500 });
    }
}

