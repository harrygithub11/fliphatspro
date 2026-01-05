import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            // 1. Total Revenue
            const [revenueResult]: any = await connection.execute(`
                SELECT COALESCE(SUM(amount), 0) as total_revenue 
                FROM orders 
                WHERE status IN ('paid', 'processing', 'delivered')
            `);

            // 2. Total Leads
            const [leadsResult]: any = await connection.execute(`
                SELECT COUNT(*) as total_leads FROM customers
            `);

            // 3. Pending Onboarding (paid but no form submission)
            const [pendingResult]: any = await connection.execute(`
                SELECT COUNT(*) as pending_count 
                FROM orders o
                LEFT JOIN project_submissions ps ON o.id = ps.order_id
                WHERE o.status = 'paid' AND ps.id IS NULL
            `);

            // 4. Issues (payment failed)
            const [issuesResult]: any = await connection.execute(`
                SELECT COUNT(*) as issues_count 
                FROM orders 
                WHERE status = 'payment_failed'
            `);

            // 5. Recent Activity (last 10 orders)
            const [activityResult]: any = await connection.execute(`
                SELECT o.id, o.razorpay_order_id, o.amount, o.status, o.created_at,
                       c.name as customer_name
                FROM orders o
                LEFT JOIN customers c ON o.customer_id = c.id
                ORDER BY o.created_at DESC
                LIMIT 10
            `);

            // 6. Revenue by day for chart (last 7 days)
            const [chartData]: any = await connection.execute(`
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(amount), 0) as revenue,
                    COUNT(*) as orders
                FROM orders
                WHERE status IN ('paid', 'processing', 'delivered')
                    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            // 7. Order status breakdown
            const [statusBreakdown]: any = await connection.execute(`
                SELECT status, COUNT(*) as count
                FROM orders
                GROUP BY status
            `);

            // 8. Source breakdown (New Year vs Lifetime)
            const [sourceBreakdown]: any = await connection.execute(`
                SELECT 
                    source, 
                    COUNT(*) as count,
                    COALESCE(SUM(amount), 0) as revenue
                FROM orders
                WHERE status IN ('paid', 'processing', 'delivered')
                GROUP BY source
            `);

            return NextResponse.json({
                revenue: revenueResult[0].total_revenue,
                totalLeads: leadsResult[0].total_leads,
                pendingOnboarding: pendingResult[0].pending_count,
                issues: issuesResult[0].issues_count,
                activity: activityResult,
                chartData: chartData,
                statusBreakdown: statusBreakdown,
                sourceBreakdown: sourceBreakdown
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
