
import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        await requirePlatformAdmin();
        const connection = await pool.getConnection();

        try {
            // 1. Total Workspaces
            const [tenants]: any = await connection.execute(
                'SELECT COUNT(*) as total, SUM(CASE WHEN status = "active" THEN 1 ELSE 0 END) as active FROM tenants'
            );

            // 2. Total Users (Global)
            const [users]: any = await connection.execute(
                'SELECT COUNT(*) as count FROM users'
            );

            // 3. Total Revenue (Global aggregation from all orders)
            // Note: In real setup, you might cache this or use a materialized view
            const [revenue]: any = await connection.execute(
                'SELECT SUM(total_amount) as total FROM orders WHERE status = "paid"'
            );

            return NextResponse.json({
                success: true,
                stats: {
                    totalRevenue: revenue[0].total || 0,
                    totalTenants: tenants[0].total || 0,
                    activeTenants: tenants[0].active || 0,
                    totalUsers: users[0].count || 0,
                    systemHealth: 'Operational',
                    revenueTrend: [] // Placeholder
                }
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Master Stats Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch platform stats'
        }, { status: 500 });
    }
}
