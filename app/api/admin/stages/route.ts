import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { tenantId } = await requireTenantAuth(request);

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(`
                SELECT id, value, label, color, display_order, is_active
                FROM lead_stages
                WHERE (tenant_id = ? OR tenant_id IS NULL) AND is_active = TRUE
                ORDER BY display_order ASC
            `, [tenantId]);
            return NextResponse.json({ success: true, stages: rows });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Failed to fetch stages:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { tenantId, session } = await requireTenantAuth(request);

        const body = await request.json();
        const { value, label, color, display_order } = body;

        if (!value || !label) {
            return NextResponse.json({ success: false, message: 'Value and label are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [result]: any = await connection.execute(
                'INSERT INTO lead_stages (tenant_id, value, label, color, display_order, created_by, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
                [tenantId, value, label, color || 'gray', display_order || 0, session.id]
            );
            return NextResponse.json({ success: true, id: result.insertId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Failed to create stage:', error);
        return NextResponse.json({ success: false, message: 'Failed to create stage' }, { status: 500 });
    }
}
