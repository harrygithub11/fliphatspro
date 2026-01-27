import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';
import { logInteraction } from '@/lib/crm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            // Get all orders (tenant-scoped)
            const [orders]: any = await connection.execute(`
                SELECT 
                    o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                    c.name as customer_name, c.email as customer_email, c.id as customer_id,
                    ps.brand_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                WHERE o.tenant_id = ? AND o.deleted_at IS NULL
                ORDER BY o.created_at DESC
            `, [tenantId]);

            // Get leads without orders (tenant-scoped)
            const [leads]: any = await connection.execute(`
                SELECT 
                    c.id as customer_id,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.created_at,
                    'new_lead' as status,
                    NULL as id,
                    NULL as razorpay_order_id,
                    NULL as amount,
                    NULL as brand_name
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
                WHERE c.tenant_id = ? AND o.id IS NULL AND c.deleted_at IS NULL
                ORDER BY c.created_at DESC
            `, [tenantId, tenantId]);

            const combined = [...orders, ...leads];

            return NextResponse.json(combined);
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch kanban data' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const body = await request.json();
        const { orderId, newStatus } = body;

        const connection = await pool.getConnection();
        try {
            // Update with tenant check for security
            await connection.execute(
                'UPDATE orders SET status = ? WHERE id = ? AND tenant_id = ?',
                [newStatus, orderId, tenantId]
            );

            const [rows]: any = await connection.execute(
                'SELECT o.customer_id, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id WHERE o.id = ? AND o.tenant_id = ?',
                [orderId, tenantId]
            );
            const customerId = rows[0]?.customer_id || null;
            const customerName = rows[0]?.customer_name || 'Unknown Customer';

            await logInteraction(customerId, orderId, 'system_event', `Order status updated to ${newStatus}`);

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'order_update',
                `Updated order #${orderId} (Customer: ${customerName}) to '${newStatus}' via Kanban`,
                'order',
                orderId
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
