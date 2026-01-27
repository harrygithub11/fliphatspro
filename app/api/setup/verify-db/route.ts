import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        // Simple select to verify existence
        await connection.execute('SELECT 1 FROM login_history LIMIT 1');
        await connection.execute('SELECT 1 FROM tenant_audit_logs LIMIT 1');

        return NextResponse.json({
            success: true,
            message: 'VERIFICATION SUCCESS: Tables login_history and tenant_audit_logs exist.'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            code: error.code
        }, { status: 500 });
    } finally {
        connection.release();
    }
}
