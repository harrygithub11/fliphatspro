
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    let connection;
    try {
        const { tenantId } = await requireTenantAuth(request);
        connection = await pool.getConnection();

        // Query distinct values directly from customers table as requested ("database check")
        const [rows]: any = await connection.execute(
            `SELECT 
                GROUP_CONCAT(DISTINCT stage) as stages,
                GROUP_CONCAT(DISTINCT score) as scores,
                GROUP_CONCAT(DISTINCT source) as sources
             FROM customers 
             WHERE tenant_id = ?`,
            [tenantId]
        );

        const data = rows[0] || {};

        const parseList = (str: string) => {
            if (!str) return [];
            return Array.from(new Set(str.split(','))).filter(Boolean).sort();
        };

        const stagesList = parseList(data.stages);
        const scoresList = parseList(data.scores);
        const sourcesList = parseList(data.sources);

        // Helper to format labels (e.g. "contacted" -> "Contacted", "follow_up" -> "Follow Up")
        const formatLabel = (val: string) => {
            return val
                .split(/[_\-]/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
        };

        const stages = stagesList.map(s => ({ value: s, label: formatLabel(s) }));
        const scores = scoresList.map(s => {
            let emoji = '';
            if (s === 'hot') emoji = '🚀';
            if (s === 'warm') emoji = '🔥';
            if (s === 'cold') emoji = '❄️';
            return { value: s, label: formatLabel(s), emoji };
        });

        return NextResponse.json({
            success: true,
            stages,
            scores,
            sources: sourcesList
        });

    } catch (error: any) {
        console.error('[LEAD_FILTERS_API_ERROR]', error);
        return NextResponse.json({ error: 'Failed to fetch filters' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
