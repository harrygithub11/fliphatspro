import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get company details with contacts and deals
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const companyId = params.id;

        const connection = await pool.getConnection();
        try {
            // Get company details
            const [companies]: any = await connection.execute(`
                SELECT c.*, u.name as owner_name
                FROM companies c
                LEFT JOIN users u ON c.owner_id = u.id
                WHERE c.id = ? AND c.tenant_id = ?
            `, [companyId, tenantId]);

            if (companies.length === 0) {
                return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
            }

            const company = companies[0];

            // Get contacts linked to this company
            const [contacts]: any = await connection.execute(`
                SELECT id, name, email, phone, stage, score, created_at
                FROM customers
                WHERE company_id = ? AND tenant_id = ?
                ORDER BY created_at DESC
            `, [companyId, tenantId]);

            // Get deal stats 
            const [deals]: any = await connection.execute(`
                SELECT id, title, amount, stage, status, expected_close_date, created_at
                FROM deals
                WHERE company_id = ? AND tenant_id = ?
                ORDER BY created_at DESC
            `, [companyId, tenantId]);

            console.log('[DEBUG_COMPANY] Fetching available contacts for tenant:', tenantId);

            // Get available contacts (not linked to any company) for assignment
            const [availableContacts]: any = await connection.execute(`
                SELECT id, name, email
                FROM customers
                WHERE tenant_id = ? AND (company_id IS NULL OR company_id = 0)
                ORDER BY created_at DESC
                LIMIT 500
            `, [tenantId]);

            console.log(`[DEBUG_COMPANY] Found ${availableContacts.length} available contacts`);

            return NextResponse.json({
                success: true,
                company,
                contacts,
                deals,
                availableContacts
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Company Details Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch company' }, { status: 500 });
    }
}

// PUT - Update company or manage contacts
export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const companyId = params.id;
        const body = await request.json();

        const connection = await pool.getConnection();
        try {
            // Link contacts to company
            if (body.action === 'link_contacts' && body.contactIds) {
                const contactIds = body.contactIds;
                if (contactIds.length > 0) {
                    const placeholders = contactIds.map(() => '?').join(',');
                    await connection.execute(`
                        UPDATE customers 
                        SET company_id = ?
                        WHERE id IN (${placeholders}) AND tenant_id = ?
                    `, [companyId, ...contactIds, tenantId]);
                }

                return NextResponse.json({ success: true, message: `${contactIds.length} contacts linked` });
            }

            // Unlink a contact from company
            if (body.action === 'unlink_contact' && body.contactId) {
                await connection.execute(`
                    UPDATE customers 
                    SET company_id = NULL
                    WHERE id = ? AND tenant_id = ?
                `, [body.contactId, tenantId]);

                return NextResponse.json({ success: true, message: 'Contact unlinked' });
            }

            // Link deals to company
            if (body.action === 'link_deal' && body.dealId) {
                await connection.execute(`
                    UPDATE deals 
                    SET company_id = ?
                    WHERE id = ? AND tenant_id = ?
                `, [companyId, body.dealId, tenantId]);

                return NextResponse.json({ success: true, message: 'Deal linked' });
            }

            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Company Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update' }, { status: 500 });
    }
}
