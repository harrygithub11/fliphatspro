import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Check if column exists
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM tasks LIKE 'assigned_to'");

        if (columns.length > 0) {
            return NextResponse.json({ success: true, message: 'Column assigned_to already exists' });
        }

        // 2. Add column if it doesn't exist
        await connection.execute("ALTER TABLE tasks ADD COLUMN assigned_to INT NULL");
        console.log("Added assigned_to column to tasks table");

        return NextResponse.json({ success: true, message: 'Successfully added assigned_to column' });

    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
