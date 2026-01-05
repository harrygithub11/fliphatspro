
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logInteraction } from '@/lib/crm';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer_id, title, amount, content } = body;

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Create Order (Draft Deal)
            const [orderResult]: any = await connection.execute(
                'INSERT INTO orders (customer_id, amount, status, proposal_status, currency) VALUES (?, ?, ?, ?, ?)',
                [customer_id, amount, 'initiated', 'draft', 'INR']
            );
            const orderId = orderResult.insertId;

            // 2. Create Proposal Link (Dynamic Web View)
            // This points to a real page we are about to create
            const mockPdfUrl = `/proposals/${orderId}`;

            await connection.execute(
                'INSERT INTO files (customer_id, uploaded_by, file_name, file_url, file_type) VALUES (?, ?, ?, ?, ?)',
                [customer_id, 1, `Proposal: ${title}`, mockPdfUrl, 'proposal']
            );

            // 3. Log Interaction
            await logInteraction(
                customer_id,
                orderId,
                'system_event',
                `Created Proposal: ${title} (₹${amount})`
            );

            // 4. Update Lead Stage (Optional but cool)
            await connection.execute(
                'UPDATE customers SET stage = ? WHERE id = ?',
                ['proposal_sent', customer_id]
            );

            await connection.commit();
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
