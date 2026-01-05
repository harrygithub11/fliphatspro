import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();
        const [cols] = await connection.execute('DESCRIBE interactions');
        connection.release();
        return NextResponse.json({ columns: cols });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
