import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

// GET: Full task detail with comments, assignees, history (tenant-scoped)
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const taskId = params.id;
        const currentUserId = session.id;

        const connection = await pool.getConnection();

        try {
            // Main task (tenant-scoped)
            const [taskRows]: any = await connection.execute(`
                SELECT t.*, 
                       tr.last_seen_at,
                       c.name AS customer_name, c.email AS customer_email,
                       a.name AS created_by_name,
                       asg.name AS assigned_name,
                       sc.name AS status_changed_by_name
                FROM tasks t
                LEFT JOIN customers c ON t.customer_id = c.id
                LEFT JOIN admins a ON t.created_by = a.id
                LEFT JOIN admins asg ON t.assigned_to = asg.id
                LEFT JOIN admins sc ON t.status_changed_by = sc.id
                LEFT JOIN task_reads tr ON t.id = tr.task_id AND tr.user_id = ?
                WHERE t.id = ? AND t.tenant_id = ? AND t.deleted_at IS NULL
            `, [currentUserId, taskId, tenantId]);

            if (taskRows.length === 0) {
                return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
            }

            const task = taskRows[0];

            // Comments
            const [comments]: any = await connection.execute(`
                SELECT tc.*, a.name AS author_name
                FROM task_comments tc
                LEFT JOIN admins a ON tc.author_id = a.id
                WHERE tc.task_id = ?
                ORDER BY tc.created_at ASC
            `, [taskId]);

            // Attachments
            const [attachments]: any = await connection.execute(`
                SELECT ta.*, a.name AS uploaded_by_name
                FROM task_attachments ta
                LEFT JOIN admins a ON ta.uploaded_by = a.id
                WHERE ta.task_id = ?
                ORDER BY ta.uploaded_at DESC
            `, [taskId]);

            // History
            const [history]: any = await connection.execute(`
                SELECT th.*, a.name AS changed_by_name
                FROM task_history th
                LEFT JOIN admins a ON th.changed_by = a.id
                WHERE th.task_id = ?
                ORDER BY th.created_at DESC
                LIMIT 50
            `, [taskId]);

            return NextResponse.json({
                success: true,
                task: {
                    ...task,
                    comments,
                    attachments,
                    history
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Task Detail Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch task' }, { status: 500 });
    }
}

// PUT: Update task and log history (tenant-scoped)
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const taskId = params.id;
        const body = await request.json();

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Get current task state (with tenant check)
            const [currentRows]: any = await connection.execute(
                'SELECT * FROM tasks WHERE id = ? AND tenant_id = ?',
                [taskId, tenantId]
            );
            if (currentRows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
            }
            const currentTask = currentRows[0];

            // 2. Prepare updates
            const fieldsToUpdate: string[] = [];
            const values: any[] = [];
            const historyEntries: { type: string, field: string, oldVal: string, newVal: string }[] = [];

            const checkChange = (field: string, newValue: any, type: string = 'field_change') => {
                if (newValue !== undefined && currentTask[field] != newValue) {
                    fieldsToUpdate.push(`${field} = ?`);
                    values.push(newValue);
                    historyEntries.push({ type, field, oldVal: String(currentTask[field] || ''), newVal: String(newValue || '') });
                }
            };

            if (body.title !== undefined) checkChange('title', body.title);
            if (body.description !== undefined) checkChange('description', body.description);
            if (body.status !== undefined) checkChange('status', body.status, 'status_change');
            if (body.priority !== undefined) checkChange('priority', body.priority, 'priority_change');
            if (body.due_date !== undefined) {
                const dateVal = body.due_date ? new Date(body.due_date).toISOString().slice(0, 19).replace('T', ' ') : null;
                if (currentTask.due_date != dateVal) {
                    fieldsToUpdate.push('due_date = ?');
                    values.push(dateVal);
                    historyEntries.push({ type: 'field_change', field: 'due_date', oldVal: String(currentTask.due_date || ''), newVal: String(dateVal || '') });
                }
            }

            // Assignee change
            if (body.assigned_to !== undefined) {
                const newAssigneeId = body.assigned_to ? parseInt(body.assigned_to) : null;
                if (currentTask.assigned_to != newAssigneeId) {
                    fieldsToUpdate.push('assigned_to = ?');
                    values.push(newAssigneeId);

                    let newAssigneeName = 'Unassigned';
                    if (newAssigneeId) {
                        const [adminRows]: any = await connection.execute('SELECT name FROM admins WHERE id = ?', [newAssigneeId]);
                        if (adminRows.length > 0) newAssigneeName = adminRows[0].name;
                    }

                    historyEntries.push({ type: 'assigned', field: 'assigned_to', oldVal: String(currentTask.assigned_to || ''), newVal: newAssigneeName });

                    if (newAssigneeId && newAssigneeId !== session.id) {
                        const { createNotification } = await import('@/lib/notifications');
                        await createNotification({
                            tenantId,
                            userId: newAssigneeId,
                            type: 'task_assigned',
                            title: 'Task Re-assigned',
                            message: `You have been assigned to task #${taskId}`,
                            link: `/workspace?taskId=${taskId}`,
                            data: { taskId }
                        });
                    }
                }
            }

            if (body.customer_id !== undefined) {
                const newCustId = body.customer_id ? parseInt(body.customer_id) : null;
                checkChange('customer_id', newCustId);
            }

            if (fieldsToUpdate.length > 0) {
                const sql = `UPDATE tasks SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND tenant_id = ?`;
                await connection.execute(sql, [...values, taskId, tenantId]);

                for (const entry of historyEntries) {
                    await connection.execute(
                        `INSERT INTO task_history (task_id, changed_by, change_type, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)`,
                        [taskId, session.id, entry.type, entry.field, entry.oldVal, entry.newVal]
                    );
                }

                if (body.status && body.status !== currentTask.status) {
                    await connection.execute('UPDATE tasks SET status_changed_by = ? WHERE id = ? AND tenant_id = ?', [session.id, taskId, tenantId]);

                    // Notify creator if task is completed
                    if (body.status === 'completed' && currentTask.created_by !== session.id) {
                        const { createNotification } = await import('@/lib/notifications');
                        await createNotification({
                            tenantId,
                            userId: currentTask.created_by,
                            type: 'success',
                            title: 'Task Completed',
                            message: `Task #${taskId} has been marked as completed`,
                            link: `/workspace?taskId=${taskId}`,
                            data: { taskId }
                        });
                    }
                }
            }

            await connection.commit();
            return NextResponse.json({ success: true });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update task' }, { status: 500 });
    }
}

// DELETE: Soft delete task (tenant-scoped)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const taskId = params.id;

        const connection = await pool.getConnection();
        try {
            // Soft delete with tenant check
            await connection.execute(
                'UPDATE tasks SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
                [taskId, tenantId]
            );

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'task_delete',
                `Soft-deleted task #${taskId}`,
                'task',
                parseInt(taskId)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to delete task' }, { status: 500 });
    }
}
