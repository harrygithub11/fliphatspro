import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Task statistics for dashboard widgets
export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            // Status counts
            const [statusCounts]: any = await connection.execute(`
                SELECT status, COUNT(*) as count
                FROM tasks
                GROUP BY status
            `);

            // Priority counts
            const [priorityCounts]: any = await connection.execute(`
                SELECT priority, COUNT(*) as count
                FROM tasks
                GROUP BY priority
            `);

            // Overdue count
            const [overdueResult]: any = await connection.execute(`
                SELECT COUNT(*) as count
                FROM tasks
                WHERE status != 'done'
                  AND due_date < NOW()
            `);

            // Due today count
            const [dueTodayResult]: any = await connection.execute(`
                SELECT COUNT(*) as count
                FROM tasks
                WHERE DATE(due_date) = CURDATE()
            `);

            // Tasks by assignee
            const [assigneeCounts]: any = await connection.execute(`
                SELECT a.id, a.name, COUNT(t.id) as count
                FROM admins a
                LEFT JOIN tasks t ON t.assigned_to = a.id
                GROUP BY a.id, a.name
                ORDER BY count DESC
            `);

            const stats = {
                byStatus: statusCounts.reduce((acc: any, row: any) => {
                    acc[row.status] = row.count;
                    return acc;
                }, {}),
                byPriority: priorityCounts.reduce((acc: any, row: any) => {
                    acc[row.priority] = row.count;
                    return acc;
                }, {}),
                overdue: overdueResult[0]?.count || 0,
                dueToday: dueTodayResult[0]?.count || 0,
                byAssignee: assigneeCounts,
                total: statusCounts.reduce((sum: number, row: any) => sum + row.count, 0)
            };

            return NextResponse.json({ success: true, stats });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Task Stats Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch stats' }, { status: 500 });
    }
}
