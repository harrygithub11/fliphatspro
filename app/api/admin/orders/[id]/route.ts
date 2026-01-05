import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const orderId = params.id;
        const connection = await pool.getConnection();

        try {
            // 1. Fetch Order & Customer Basic Info
            const [orderRows]: any = await connection.execute(`
                SELECT 
                    o.*,
                    c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.ltv, c.notes as customer_notes
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.id = ?
            `, [orderId]);

            if (orderRows.length === 0) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            const order = orderRows[0];

            // 2. Fetch Project Submission (Onboarding Data)
            const [submissionRows]: any = await connection.execute(
                'SELECT * FROM project_submissions WHERE order_id = ?',
                [orderId]
            );

            // 3. Fetch Interactions (Timeline) with admin names
            const [interactionRows]: any = await connection.execute(
                `SELECT i.*, a.name as created_by_name, a.email as created_by_email 
                 FROM interactions i 
                 LEFT JOIN admins a ON i.created_by = a.id 
                 WHERE i.order_id = ? 
                 ORDER BY i.created_at DESC`,
                [orderId]
            );

            // 4. Fetch Tasks
            const [taskRows]: any = await connection.execute(
                'SELECT * FROM tasks WHERE related_order_id = ? ORDER BY created_at DESC',
                [orderId]
            );

            return NextResponse.json({
                order,
                submission: submissionRows[0] || null,
                interactions: interactionRows,
                tasks: taskRows
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Fetch Order Detail Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const orderId = params.id;
        const body = await request.json();
        const { content, type } = body; // type defaults to 'internal_note' if not provided

        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const connection = await pool.getConnection();
        try {
            // Get customer ID and Name
            const [orderRows]: any = await connection.execute(
                'SELECT o.customer_id, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?',
                [orderId]
            );
            if (orderRows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const customerId = orderRows[0].customer_id;
            const customerName = orderRows[0].customer_name || 'Unknown';

            // Insert Interaction
            const finalType = type || 'internal_note';
            const [res]: any = await connection.execute(
                'INSERT INTO interactions (type, order_id, customer_id, content, created_at) VALUES (?, ?, ?, ?, NOW())',
                [finalType, orderId, customerId, content]
            );

            const newInteraction = {
                id: res.insertId,
                type: finalType,
                order_id: orderId,
                customer_id: customerId,
                content: content,
                created_at: new Date().toISOString()
            };

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'note_create',
                    `Added note to order #${orderId} (${customerName}): "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                    'order',
                    parseInt(orderId)
                );
            }

            return NextResponse.json(newInteraction);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Interaction Error:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const orderId = params.id;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Fetch info before delete
            const [rows]: any = await connection.execute(
                'SELECT o.customer_id, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ?',
                [orderId]
            );
            const customerName = rows[0]?.customer_name || 'Unknown';

            // 1. Delete Interactions
            await connection.execute('DELETE FROM interactions WHERE order_id = ?', [orderId]);

            // 2. Delete Tasks
            await connection.execute('DELETE FROM tasks WHERE related_order_id = ?', [orderId]);

            // 3. Delete Submissions
            await connection.execute('DELETE FROM project_submissions WHERE order_id = ?', [orderId]);

            // 4. Delete Order
            await connection.execute('DELETE FROM orders WHERE id = ?', [orderId]);

            await connection.commit();

            // Log Admin Activity
            const { getSession } = await import('@/lib/auth');
            const session = await getSession();
            if (session) {
                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'order_delete',
                    `Deleted order #${orderId} (Customer: ${customerName})`,
                    'order',
                    parseInt(orderId)
                );
            }

            return NextResponse.json({ success: true });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Delete Order Error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
