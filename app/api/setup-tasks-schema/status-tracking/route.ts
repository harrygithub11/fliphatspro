import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        // Check if status_changed_by column exists
        const [cols]: any = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'status_changed_by'`
        );

        if (cols.length === 0) {
            await connection.execute(`ALTER TABLE tasks ADD COLUMN status_changed_by INT NULL`);
            await connection.execute(`ALTER TABLE tasks ADD COLUMN status_changed_at DATETIME NULL`);
            return NextResponse.json({ success: true, message: 'Added status tracking columns' });
        }

        return NextResponse.json({ success: true, message: 'Columns already exist' });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    } finally {
        connection.release();
    }
}
