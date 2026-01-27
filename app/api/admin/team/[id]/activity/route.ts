
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);
        const userIdToFetch = parseInt(params.id);

        if (isNaN(userIdToFetch)) {
            return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'login' or 'all'

        const connection = await pool.getConnection();

        try {
            let logs = [];

            if (type === 'login') {
                // Fetch from tenant_audit_logs (Security/Login events)
                // Maps fields to match the frontend expectation (content/action)
                const [rows]: any = await connection.execute(`
                    SELECT 
                        id, 
                        action, 
                        created_at, 
                        ip_address, 
                        -- Map IP to content so it shows up in the 'details' column on UI
                        CONCAT('IP: ', IFNULL(ip_address, 'Unknown'), ' - ', IFNULL(user_agent, 'Web')) as content
                    FROM tenant_audit_logs
                    WHERE user_id = ? AND action = 'Login'
                    ORDER BY created_at DESC LIMIT 50
                `, [userIdToFetch]);
                logs = rows;
            } else {
                // Fetch from interactions (General Activity Feed)
                const [rows]: any = await connection.execute(`
                    SELECT 
                        i.id, 
                        i.type as action, 
                        i.content, 
                        i.created_at,
                        i.customer_id,
                        c.name as customer_name
                    FROM interactions i
                    LEFT JOIN customers c ON i.customer_id = c.id
                    WHERE i.created_by = ? AND i.tenant_id = ?
                    ORDER BY i.created_at DESC LIMIT 50
                `, [userIdToFetch, tenantId]);
                logs = rows;
            }

            return NextResponse.json({ success: true, logs });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Get Activity Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch logs' }, { status: 500 });
    }
}
