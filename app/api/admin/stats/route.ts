import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        // Require tenant context
        const { session, tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();

        try {
            // 1. Total Revenue (tenant-scoped)
            const [revenueResult]: any = await connection.execute(`
                SELECT COALESCE(SUM(amount), 0) as total_revenue 
                FROM orders 
                WHERE tenant_id = ? AND status IN ('paid', 'processing', 'delivered')
            `, [tenantId]);

            // 2. Total Leads (tenant-scoped)
            const [leadsResult]: any = await connection.execute(`
                SELECT COUNT(*) as total_leads FROM customers WHERE tenant_id = ?
            `, [tenantId]);

            // 3. Pending Onboarding (paid but no form submission) - tenant-scoped
            const [pendingResult]: any = await connection.execute(`
                SELECT COUNT(*) as pending_count 
                FROM orders o
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                WHERE o.tenant_id = ? AND o.status = 'paid' AND ps.id IS NULL
            `, [tenantId]);

            // 4. Issues (payment failed) - tenant-scoped
            const [issuesResult]: any = await connection.execute(`
                SELECT COUNT(*) as issues_count 
                FROM orders 
                WHERE tenant_id = ? AND status = 'payment_failed'
            `, [tenantId]);

            // 5. Recent Activity (last 10 orders) - tenant-scoped
            const [activityResult]: any = await connection.execute(`
                SELECT o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                       c.name as customer_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                WHERE o.tenant_id = ?
                ORDER BY o.created_at DESC
                LIMIT 10
            `, [tenantId]);

            // 6. Revenue by day for chart (last 7 days) - tenant-scoped
            const [chartData]: any = await connection.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(amount), 0) as revenue,
                    COUNT(*) as orders
                FROM orders
                WHERE tenant_id = ? 
                    AND status IN ('paid', 'processing', 'delivered')
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `, [tenantId]);

            // 7. Order status breakdown - tenant-scoped
            const [statusBreakdown]: any = await connection.execute(`
                SELECT status, COUNT(*) as count
                FROM orders
                WHERE tenant_id = ?
                GROUP BY status
            `, [tenantId]);

            // 8. Source breakdown - tenant-scoped
            const [sourceBreakdown]: any = await connection.execute(`
                SELECT 
                    source, 
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as revenue
                FROM orders
                WHERE tenant_id = ? AND status IN ('paid', 'processing', 'delivered')
                GROUP BY source
            `, [tenantId]);

            // 9. Leads created today (for header) - tenant-scoped
            const [leadsTodayResult]: any = await connection.execute(`
                SELECT COUNT(*) as count FROM customers 
                WHERE tenant_id = ? AND DATE(created_at) = CURDATE()
            `, [tenantId]);

            // 10. Open tasks count (for header) - tenant-scoped
            const [openTasksResult]: any = await connection.execute(`
                SELECT COUNT(*) as count FROM tasks 
                WHERE tenant_id = ? AND status != 'done'
            `, [tenantId]);

            // 11. Deals won (completed orders) - tenant-scoped
            const [dealsWonResult]: any = await connection.execute(`
                SELECT COUNT(*) as count FROM orders 
                WHERE tenant_id = ? AND status IN ('paid', 'delivered', 'completed')
            `, [tenantId]);

            // 12. CRM Pipeline Stats (Real Deals)
            const [pipelineStats]: any = await connection.execute(`
                SELECT 
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_deals,
                    COALESCE(SUM(CASE WHEN status = 'open' THEN amount ELSE 0 END), 0) as pipeline_value,
                    COUNT(CASE WHEN status = 'won' THEN 1 END) as won_deals_count
                FROM deals
                WHERE tenant_id = ? AND deleted_at IS NULL
            `, [tenantId]);

            return NextResponse.json({
                success: true,
                revenue: revenueResult[0].total_revenue,
                totalLeads: leadsResult[0].total_leads,
                pendingOnboarding: pendingResult[0].pending_count,
                issues: issuesResult[0].issues_count,
                activity: activityResult,
                chartData: chartData,
                statusBreakdown: statusBreakdown,
                sourceBreakdown: sourceBreakdown,
                // Header stats
                leadsToday: leadsTodayResult[0]?.count || 0,
                openTasks: openTasksResult[0]?.count || 0,
                // Combine E-comm orders and CRM deals for "Deals Won" or just use CRM? 
                // Let's use CRM deals count if > 0, else orders (fallback for hybrid usage)
                dealsWon: (pipelineStats[0]?.won_deals_count || 0) + (dealsWonResult[0]?.count || 0),
                pipelineValue: pipelineStats[0]?.pipeline_value || 0,
                activeDeals: pipelineStats[0]?.open_deals || 0
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
