import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Check if column exists
        const [columns]: any = await connection.execute("SHOW COLUMNS FROM tasks LIKE 'created_by'");

        if (columns.length > 0) {
            return NextResponse.json({ success: true, message: 'Column created_by already exists' });
        }

        // 2. Add column if it doesn't exist
        await connection.execute("ALTER TABLE tasks ADD COLUMN created_by INT NULL");
        console.log("Added created_by column to tasks table");

        return NextResponse.json({ success: true, message: 'Successfully added created_by column' });

    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
