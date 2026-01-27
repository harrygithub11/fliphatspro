
import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await requirePlatformAdmin();
        const connection = await pool.getConnection();

        try {
            // Fetch tenants with user counts and detailed info
            const [tenants]: any = await connection.execute(`
                SELECT 
                    t.*,
                    COUNT(DISTINCT tu.user_id) as user_count,
                    (SELECT COUNT(*) FROM orders o WHERE o.tenant_id = t.id) as order_count,
                    u.email as owner_email,
                    u.name as owner_name
                FROM tenants t
                LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
                LEFT JOIN users u ON t.owner_id = u.id
                GROUP BY t.id
                ORDER BY t.created_at DESC
            `);

            return NextResponse.json({
                success: true,
                tenants: tenants.map((t: any) => ({
                    ...t,
                    settings: typeof t.settings === 'string' ? JSON.parse(t.settings) : t.settings
                }))
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Master Tenants API Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch tenants'
        }, { status: 500 });
    }
}
