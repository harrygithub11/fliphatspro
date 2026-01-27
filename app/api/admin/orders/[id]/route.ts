import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const orderId = params.id;
        const connection = await pool.getConnection();

        try {
            // 1. Fetch Order & Customer Basic Info
            const [orderRows]: any = await connection.execute(`
                SELECT 
                    o.*,
                    c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.ltv, c.notes as customer_notes
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id AND c.tenant_id = ?
                WHERE o.id = ? AND o.tenant_id = ? AND o.deleted_at IS NULL
            `, [tenantId, orderId, tenantId]);

            if (orderRows.length === 0) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }
            const order = orderRows[0];

            // 2. Fetch Project Submission (Onboarding Data)
            // Note: submissions usually link to order directly but verify schema if tenant_id exists there
            const [submissionRows]: any = await connection.execute(
                'SELECT * FROM project_submissions WHERE order_id = ?',
                [orderId]
            );

            // 3. Fetch Interactions (Timeline) with admin names
            const [interactionRows]: any = await connection.execute(
                `SELECT i.*, a.name as created_by_name, a.email as created_by_email 
                 FROM interactions i 
                 LEFT JOIN users a ON i.created_by = a.id 
                 WHERE i.order_id = ? AND i.tenant_id = ?
                 ORDER BY i.created_at DESC`,
                [orderId, tenantId]
            );

            // 4. Fetch Tasks (with soft delete filter)
            const [taskRows]: any = await connection.execute(
                'SELECT * FROM tasks WHERE related_order_id = ? AND tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
                [orderId, tenantId]
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

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Fetch Order Detail Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const orderId = params.id;
        const body = await request.json();
        const { content, type } = body; // type defaults to 'internal_note' if not provided

        if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

        const connection = await pool.getConnection();
        try {
            // Get customer ID and Name
            const [orderRows]: any = await connection.execute(
                'SELECT o.customer_id, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ? AND o.tenant_id = ?',
                [orderId, tenantId]
            );
            if (orderRows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const customerId = orderRows[0].customer_id;
            const customerName = orderRows[0].customer_name || 'Unknown';

            // Insert Interaction
            const finalType = type || 'internal_note';
            const [res]: any = await connection.execute(
                'INSERT INTO interactions (tenant_id, type, order_id, customer_id, content, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                [tenantId, finalType, orderId, customerId, content, session.id]
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
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'note_create',
                `Added note to order #${orderId} (${customerName}): "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                'order',
                parseInt(orderId)
            );

            return NextResponse.json(newInteraction);
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error("Create Interaction Error:", error);
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId, tenantRole } = await requireTenantAuth(request);

        // Only owners/admins/members can delete
        if (tenantRole === 'viewer') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const orderId = params.id;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Fetch info before delete to verify ownership/existence
            const [rows]: any = await connection.execute(
                'SELECT o.customer_id, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ? AND o.tenant_id = ?',
                [orderId, tenantId]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            const customerName = rows[0]?.customer_name || 'Unknown';

            // SOFT DELETE: Set deleted_at instead of hard delete (compliance)

            // 1. Soft delete Interactions
            await connection.execute(
                'UPDATE interactions SET deleted_at = NOW() WHERE order_id = ? AND tenant_id = ?',
                [orderId, tenantId]
            );

            // 2. Soft delete Tasks
            await connection.execute(
                'UPDATE tasks SET deleted_at = NOW() WHERE related_order_id = ? AND tenant_id = ?',
                [orderId, tenantId]
            );

            // 3. Soft delete Order
            await connection.execute(
                'UPDATE orders SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
                [orderId, tenantId]
            );

            await connection.commit();

            // Log Admin Activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'order_delete',
                `Deleted order #${orderId} (Customer: ${customerName})`,
                'order',
                parseInt(orderId)
            );

            return NextResponse.json({ success: true });

        } catch (dbError) {
            await connection.rollback();
            throw dbError;
        } finally {
            connection.release();
        }

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error("Delete Order Error:", error);
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
