import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';
import { logInteraction } from '@/lib/crm';

export async function POST(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);

        const body = await request.json();
        const { customer_id, file_name, file_url, file_type } = body;

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO files (tenant_id, customer_id, file_name, file_url, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
                [tenantId, customer_id, file_name, file_url, file_type || 'link', session.id]
            );

            await logInteraction(
                customer_id,
                null,
                'system_event',
                `Added file/link: ${file_name}`
            );

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'file_upload',
                `Added file/link: ${file_name} for customer #${customer_id}`,
                'customer',
                customer_id
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create File Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to add file' }, { status: 500 });
    }
}
