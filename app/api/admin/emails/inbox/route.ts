
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        // Fetch only inbound emails, ordered by newest first
        const [rows] = await pool.execute(
            `SELECT * FROM emails 
             WHERE direction = 'inbound' 
             ORDER BY created_at DESC 
             LIMIT 100`
        );

        return NextResponse.json({ success: true, emails: rows });
    } catch (error: any) {
        console.error('Fetch Inbox Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
