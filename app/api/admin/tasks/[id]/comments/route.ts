import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

// GET: List comments for a task
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId } = await requireTenantAuth(request);
        const taskId = params.id;
        const connection = await pool.getConnection();

        try {
            // Verify task belongs to tenant by strict join
            const [comments]: any = await connection.execute(`
                SELECT tc.*, a.name AS author_name
                FROM task_comments tc
                INNER JOIN tasks t ON tc.task_id = t.id AND t.tenant_id = ?
                LEFT JOIN admins a ON tc.author_id = a.id
                WHERE tc.task_id = ?
                ORDER BY tc.created_at ASC
            `, [tenantId, taskId]);

            return NextResponse.json({ success: true, comments });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Comments Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch comments' }, { status: 500 });
    }
}

// POST: Add a comment
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const taskId = params.id;
        const body = await request.json();
        const { body: commentBody } = body;

        if (!commentBody || !commentBody.trim()) {
            return NextResponse.json({ success: false, message: 'Comment body required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Verify task ownership AND get details for notification
            const [taskRows]: any = await connection.execute(
                'SELECT id, created_by, assigned_to FROM tasks WHERE id = ? AND tenant_id = ?',
                [taskId, tenantId]
            );

            if (taskRows.length === 0) {
                return NextResponse.json({ success: false, message: 'Task not found or access denied' }, { status: 404 });
            }
            const task = taskRows[0];

            const [result]: any = await connection.execute(
                'INSERT INTO task_comments (task_id, author_id, body) VALUES (?, ?, ?)',
                [taskId, session.id, commentBody.trim()]
            );

            // Log to task history (tenant-safe by association)
            await connection.execute(
                `INSERT INTO task_history (task_id, changed_by, change_type, new_value) VALUES (?, ?, ?, ?)`,
                [taskId, session.id, 'comment_added', commentBody.substring(0, 100)]
            );

            // Notify relevant users
            const { createNotification } = await import('@/lib/notifications');
            // Notify assignee if it's not the comment author
            if (task.assigned_to && task.assigned_to !== session.id) {
                await createNotification({
                    tenantId,
                    userId: task.assigned_to,
                    type: 'info',
                    title: 'New Comment on Task',
                    message: `New comment on task #${taskId}`,
                    link: `/workspace?taskId=${taskId}`,
                    data: { taskId, commentId: result.insertId }
                });
            }
            // Notify creator if it's not the comment author and not the assignee (to avoid double notify)
            if (task.created_by && task.created_by !== session.id && task.created_by !== task.assigned_to) {
                await createNotification({
                    tenantId,
                    userId: task.created_by,
                    type: 'info',
                    title: 'New Comment on Task',
                    message: `New comment on task #${taskId}`,
                    link: `/workspace?taskId=${taskId}`,
                    data: { taskId, commentId: result.insertId }
                });
            }

            // Log admin activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'task_comment',
                `Added comment on task #${taskId}`,
                'task',
                parseInt(taskId)
            );

            return NextResponse.json({ success: true, commentId: result.insertId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Add Comment Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to add comment' }, { status: 500 });
    }
}
