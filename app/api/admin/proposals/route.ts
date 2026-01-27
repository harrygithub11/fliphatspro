
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';
import { logInteraction } from '@/lib/crm';

export async function POST(request: Request) {
    try {
        // CRITICAL: Require tenant context
        const { session, tenantId } = await requireTenantAuth(request);

        const body = await request.json();
        const { customer_id, title, amount, content } = body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Verify customer belongs to tenant
            const [cust]: any = await connection.execute(
                'SELECT id, name FROM customers WHERE id = ? AND tenant_id = ?',
                [customer_id, tenantId]
            );
            if (cust.length === 0) {
                await connection.rollback();
                return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
            }
            const customerName = cust[0].name;

            // 2. Create Order (Draft Deal) with tenant_id AND created_by
            const [orderResult]: any = await connection.execute(
                `INSERT INTO orders (tenant_id, created_by, customer_id, amount, status, proposal_status, currency) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [tenantId, session.id, customer_id, amount, 'initiated', 'draft', 'INR']
            );
            const orderId = orderResult.insertId;

            // 3. Create Proposal Link (Dynamic Web View)
            const mockPdfUrl = `/proposals/${orderId}`;

            // 4. Insert into files with tenant_id
            await connection.execute(
                `INSERT INTO files (tenant_id, customer_id, uploaded_by, file_name, file_url, file_type, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [tenantId, customer_id, session.id, `Proposal: ${title}`, mockPdfUrl, 'proposal']
            );

            // 5. Log Interaction with tenant_id
            await connection.execute(
                `INSERT INTO interactions (tenant_id, customer_id, order_id, type, content, created_by, created_at)
                 VALUES (?, ?, ?, 'system_event', ?, ?, NOW())`,
                [tenantId, customer_id, orderId, `Created Proposal: ${title} (₹${amount})`, session.id]
            );

            // 6. Update Lead Stage (Optional)
            await connection.execute(
                'UPDATE customers SET stage = ? WHERE id = ? AND tenant_id = ?',
                ['proposal_sent', customer_id, tenantId]
            );

            await connection.commit();

            // Log Admin Activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'proposal_create',
                `Created Proposal: ${title} (Rs. ${amount}) for ${customerName}`,
                'order',
                orderId
            );

            return NextResponse.json({ success: true, orderId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Proposal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create proposal' }, { status: 500 });
    }
}
