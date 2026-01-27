import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Duplicate removed

export async function GET(request: Request) {
    try {
        // Require tenant context
        const { tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            // Join Orders with Customers (tenant-scoped)
            const [rows]: any = await connection.execute(`
                SELECT 
                    o.id, 
                    o.razorpay_order_id, 
                    o.amount, 
                    o.status, 
                    o.onboarding_status, 
                    o.created_at,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.phone as customer_phone
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id AND c.tenant_id = ?
                WHERE o.tenant_id = ? AND o.deleted_at IS NULL
                ORDER BY o.created_at DESC
                LIMIT 100
            `, [tenantId, tenantId]);

            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fetch Orders Error:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // CRITICAL: Require tenant context
        const { session, tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            // Get a random customer FROM THIS TENANT ONLY
            const [customers]: any = await connection.execute(
                'SELECT id FROM customers WHERE tenant_id = ? AND deleted_at IS NULL ORDER BY RAND() LIMIT 1',
                [tenantId]
            );

            let customerId;
            if (customers.length === 0) {
                // Create dummy customer if none exist IN THIS TENANT
                const [res]: any = await connection.execute(
                    `INSERT INTO customers (tenant_id, created_by, name, email, stage, score) 
                     VALUES (?, ?, 'Test User', 'test@example.com', 'new', 'cold')`,
                    [tenantId, session.id]
                );
                customerId = res.insertId;
            } else {
                customerId = customers[0].id;
            }

            const amount = Math.floor(Math.random() * 10000) + 500;
            const rzpId = `order_${Math.random().toString(36).substring(7)}`;

            // CRITICAL: Include tenant_id and created_by in INSERT
            const [result]: any = await connection.execute(
                `INSERT INTO orders (tenant_id, created_by, customer_id, razorpay_order_id, amount, status, currency) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, session.id, customerId, rzpId, amount, 'paid', 'INR']
            );

            // Fetch customer name for logging (with tenant filter)
            const [cust]: any = await connection.execute(
                'SELECT name FROM customers WHERE id = ? AND tenant_id = ?',
                [customerId, tenantId]
            );
            const customerName = cust[0]?.name || 'Unknown';

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'order_create',
                `Created manual order #${result.insertId} (Rs. ${amount}) for ${customerName}`,
                'order',
                result.insertId
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
