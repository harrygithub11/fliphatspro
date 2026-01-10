
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const [rows]: any = await pool.execute(
            `SELECT e.*, 
                    s.name as smtp_account_name, 
                    s.from_email as account_email,
                    c.name as customer_name,
                    c.email as customer_email,
                    c.avatar_url
             FROM emails e
             LEFT JOIN smtp_accounts s ON e.smtp_account_id = s.id
             LEFT JOIN customers c ON e.customer_id = c.id
             WHERE e.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Email not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, email: rows[0] });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const id = params.id;
        const body = await req.json();
        const { is_read, folder } = body;

        const updates = [];
        const values = [];

        if (is_read !== undefined) {
            updates.push('is_read = ?');
            values.push(is_read ? 1 : 0);
        }

        if (folder !== undefined) {
            updates.push('folder = ?');
            values.push(folder);
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, message: 'No updates provided' });
        }

        values.push(id);

        await pool.execute(
            `UPDATE emails SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
