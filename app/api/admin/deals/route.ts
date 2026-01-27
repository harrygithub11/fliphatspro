import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all deals with filters
export async function GET(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { searchParams } = new URL(request.url);

        const status = searchParams.get('status'); // open, won, lost
        const stage = searchParams.get('stage');
        const owner = searchParams.get('owner');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
            SELECT 
                d.*,
                c.name as customer_name,
                c.email as customer_email,
                c.company as customer_company,
                u.name as owner_name,
                comp.name as company_name
            FROM deals d
            LEFT JOIN customers c ON d.customer_id = c.id
            LEFT JOIN users u ON d.owner_id = u.id
            LEFT JOIN companies comp ON d.company_id = comp.id
            WHERE d.tenant_id = ? AND d.deleted_at IS NULL
        `;
        const params: any[] = [tenantId];

        if (status) {
            query += ' AND d.status = ?';
            params.push(status);
        }
        if (stage) {
            query += ' AND d.stage = ?';
            params.push(stage);
        }
        if (owner) {
            query += ' AND d.owner_id = ?';
            params.push(owner);
        }
        if (search) {
            query += ' AND (d.title LIKE ? OR c.name LIKE ? OR c.company LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY d.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const connection = await pool.getConnection();
        try {
            const [deals]: any = await connection.query(query, params);

            // Get totals by stage
            const [stageTotals]: any = await connection.execute(`
                SELECT 
                    stage,
                    COUNT(*) as count,
                    SUM(amount) as total_value
                FROM deals
                WHERE tenant_id = ? AND status = 'open' AND deleted_at IS NULL
                GROUP BY stage
            `, [tenantId]);

            // Get overall stats
            const [stats]: any = await connection.execute(`
                SELECT 
                    COUNT(*) as total_deals,
                    SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_deals,
                    SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won_deals,
                    SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_deals,
                    SUM(CASE WHEN status = 'open' THEN amount ELSE 0 END) as pipeline_value,
                    SUM(CASE WHEN status = 'won' THEN amount ELSE 0 END) as won_value
                FROM deals
                WHERE tenant_id = ? AND deleted_at IS NULL
            `, [tenantId]);

            return NextResponse.json({
                success: true,
                deals,
                stageTotals,
                stats: stats[0] || {}
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Deals Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch deals' }, { status: 500 });
    }
}

// POST - Create a new deal
export async function POST(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const body = await request.json();

        const {
            customer_id,
            company_id,
            title,
            description,
            amount,
            currency,
            stage,
            probability,
            expected_close_date,
            source,
            owner_id
        } = body;

        if (!title) {
            return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [res]: any = await connection.execute(`
                INSERT INTO deals (
                    tenant_id, customer_id, company_id, title, description, amount, currency,
                    stage, probability, expected_close_date, source, owner_id, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
            `, [
                tenantId,
                customer_id || null,
                company_id || null,
                title,
                description || null,
                amount || 0,
                currency || 'INR',
                stage || 'lead',
                probability || 10,
                expected_close_date || null,
                source || null,
                owner_id || session.id
            ]);

            const dealId = res.insertId;

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'deal_create',
                `Created deal: "${title}" worth ₹${amount || 0}`,
                'deal',
                dealId
            );

            // If linked to customer, log interaction
            if (customer_id) {
                const { logInteraction } = await import('@/lib/crm');
                await logInteraction(customer_id, null, 'system_event', `New deal created: "${title}"`);
            }

            // Notify Owner
            if (owner_id && owner_id !== session.id) {
                const { createNotification } = await import('@/lib/notifications');
                await createNotification({
                    tenantId,
                    userId: owner_id,
                    type: 'info',
                    title: 'New Deal Assigned',
                    message: `You have been assigned to deal "${title}"`,
                    link: `/admin/deals?id=${dealId}`,
                    data: { dealId }
                });
            }

            return NextResponse.json({ success: true, dealId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create deal' }, { status: 500 });
    }
}

// PUT - Update a deal
export async function PUT(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Deal ID is required' }, { status: 400 });
        }

        // Allowed fields to update
        const allowedFields = [
            'title', 'description', 'amount', 'currency', 'stage',
            'probability', 'expected_close_date', 'actual_close_date',
            'status', 'lost_reason', 'source', 'owner_id', 'customer_id'
        ];

        const filteredUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = value;
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
        }

        // If status is changing to won/lost, set actual_close_date
        if (filteredUpdates.status === 'won' || filteredUpdates.status === 'lost') {
            filteredUpdates.actual_close_date = new Date().toISOString().split('T')[0];
        }

        const keys = Object.keys(filteredUpdates);
        const values = Object.values(filteredUpdates);
        const setClause = keys.map(k => `${k} = ?`).join(', ');

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `UPDATE deals SET ${setClause}, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
                [...values, id, tenantId]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            const changes = Object.entries(filteredUpdates)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');

            await logAdminActivity(
                session.id,
                'deal_update',
                `Updated deal #${id}: ${changes}`,
                'deal',
                parseInt(id) // Ensure ID is parsed if it's string
            );

            // Notify on WON
            if (filteredUpdates.status === 'won') {
                const { createNotification } = await import('@/lib/notifications');
                // Notify Owner
                // We need to fetch owner_id if not in updates. 
                // But for efficiency, let's just assume if session.id isn't the owner, we notify someone?
                // Or better, fetch the deal owner to be sure.
                const [d]: any = await connection.execute('SELECT owner_id, title, amount FROM deals WHERE id = ?', [id]);
                if (d.length > 0) {
                    const deal = d[0];
                    await createNotification({
                        tenantId,
                        userId: deal.owner_id, // Notify the deal owner
                        type: 'success',
                        title: 'Deal Won! 🎉',
                        message: `Deal "${deal.title}" (₹${deal.amount}) has been closed WON!`,
                        link: `/deals?id=${id}`,
                        data: { dealId: id }
                    });
                }
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update deal' }, { status: 500 });
    }
}

// DELETE - Remove a deal
export async function DELETE(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Deal ID is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Get deal info before deleting for logging
            const [deals]: any = await connection.execute(
                'SELECT title FROM deals WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            if (deals.length === 0) {
                return NextResponse.json({ success: false, message: 'Deal not found' }, { status: 404 });
            }

            // SOFT DELETE: Set deleted_at instead of hard delete (compliance)
            await connection.execute(
                'UPDATE deals SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'deal_delete',
                `Deleted deal: "${deals[0].title}"`,
                'deal',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete Deal Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to delete deal' }, { status: 500 });
    }
}
