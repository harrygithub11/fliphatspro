
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all templates
export async function GET(req: NextRequest) {
    try {
        const [rows]: any = await pool.execute('SELECT * FROM email_templates ORDER BY created_at DESC');
        return NextResponse.json({ success: true, templates: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create or update template
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, name, subject, body_text, body_html, category } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        if (id) {
            // Update
            await pool.execute(`
                UPDATE email_templates 
                SET name = ?, subject = ?, body_text = ?, body_html = ?, category = ?
                WHERE id = ?
            `, [name, subject || '', body_text || '', body_html || '', category || null, id]);

            return NextResponse.json({ success: true, message: 'Template updated', id });
        } else {
            // Create
            const [result]: any = await pool.execute(`
                INSERT INTO email_templates (name, subject, body_text, body_html, category)
                VALUES (?, ?, ?, ?, ?)
            `, [name, subject || '', body_text || '', body_html || '', category || null]);

            return NextResponse.json({ success: true, message: 'Template created', id: result.insertId });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE template
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM email_templates WHERE id = ?', [id]);
        return NextResponse.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
