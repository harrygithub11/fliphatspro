import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all templates (tenant-scoped)
export async function GET(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const [rows]: any = await pool.execute(
            'SELECT * FROM email_templates WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY created_at DESC',
            [tenantId]
        );
        return NextResponse.json({ success: true, templates: rows });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// POST create or update template (tenant-scoped)
export async function POST(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const body = await req.json();
        const { id, name, subject, body_text, body_html, category } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
        }

        if (id) {
            // Update with tenant check
            await pool.execute(`
                UPDATE email_templates 
                SET name = ?, subject = ?, body_text = ?, body_html = ?, category = ?
                WHERE id = ? AND tenant_id = ?
            `, [name, subject || '', body_text || '', body_html || '', category || null, id, tenantId]);

            return NextResponse.json({ success: true, message: 'Template updated', id });
        } else {
            // Create with tenant_id
            const [result]: any = await pool.execute(`
                INSERT INTO email_templates (tenant_id, name, subject, body_text, body_html, category)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [tenantId, name, subject || '', body_text || '', body_html || '', category || null]);

            return NextResponse.json({ success: true, message: 'Template created', id: result.insertId });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

// DELETE template (tenant-scoped)
export async function DELETE(req: NextRequest) {
    try {
        const { tenantId } = await requireTenantAuth(req);

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

        await pool.execute('DELETE FROM email_templates WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        return NextResponse.json({ success: true, message: 'Template deleted' });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
