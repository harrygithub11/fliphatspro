import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const connection = await pool.getConnection();

        try {
            // 1. Fetch Customer Profile
            const [rows]: any = await connection.execute('SELECT * FROM customers WHERE id = ?', [id]);
            if (rows.length === 0) {
                return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
            }
            const customer = rows[0];

            // 2. Fetch Deals (Orders)
            const [deals]: any = await connection.execute(
                'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
                [id]
            );

            // 3. Fetch Interactions (Timeline) with admin names
            const [interactions]: any = await connection.execute(
                `SELECT i.*, a.name as created_by_name, a.email as created_by_email 
                 FROM interactions i 
                 LEFT JOIN admins a ON i.created_by = a.id 
                 WHERE i.customer_id = ? 
                 ORDER BY i.created_at DESC`,
                [id]
            );

            // 4. Fetch Tasks (from new customer_id link)
            const [taskRows]: any = await connection.execute(
                'SELECT * FROM tasks WHERE customer_id = ? ORDER BY due_date ASC',
                [id]
            );
            const tasks = taskRows;

            // 5. Fetch Files
            const [fileRows]: any = await connection.execute(
                'SELECT * FROM files WHERE customer_id = ? ORDER BY created_at DESC',
                [id]
            );

            return NextResponse.json({
                success: true,
                data: {
                    profile: customer,
                    deals,
                    timeline: interactions,
                    tasks,
                    files: fileRows
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Lead 360 Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const id = params.id;

        // Remove id/created_at if present to avoid errors
        const { id: _, created_at: __, ...updateFields } = body;

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' });
        }

        const keys = Object.keys(updateFields);
        const values = Object.values(updateFields);

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const query = `UPDATE customers SET ${setClause} WHERE id = ?`;

        const connection = await pool.getConnection();
        try {
            // Get session for logging
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();

            await connection.execute(query, [...values, id]);

            // Log interaction if owner was changed
            if (updateFields.owner && session) {
                await connection.execute(
                    `INSERT INTO interactions (customer_id, type, content, created_by, created_at) 
                     VALUES (?, 'system_event', ?, ?, NOW())`,
                    [id, `Assigned lead to ${updateFields.owner}`, session.id]
                );

                // Log activity
                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'lead_assignment',
                    `Assigned lead to ${updateFields.owner}`,
                    'customer',
                    parseInt(id)
                );
            }

            // Log other field updates
            if (session && Object.keys(updateFields).length > 0) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                const fieldNames = Object.keys(updateFields).join(', ');
                await logAdminActivity(
                    session.id,
                    'lead_update',
                    `Updated lead fields: ${fieldNames}`,
                    'customer',
                    parseInt(id)
                );
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
    }
}
