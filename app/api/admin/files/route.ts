
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logInteraction } from '@/lib/crm';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { customer_id, file_name, file_url, file_type } = body;

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO files (customer_id, file_name, file_url, file_type) VALUES (?, ?, ?, ?)',
                [customer_id, file_name, file_url, file_type || 'link']
            );

            await logInteraction(
                customer_id,
                null,
                'system_event',
                `Added file/link: ${file_name}`
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create File Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to add file' }, { status: 500 });
    }
}
