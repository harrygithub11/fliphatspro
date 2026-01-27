/**
 * Leads API - Multi-Tenant Version
 * 
 * This is the tenant-aware version of the leads API.
 * All queries are automatically scoped to the current tenant.
 */

import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import { getTenantDb } from '@/lib/tenant-db';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/leads
 * Fetch all leads for the current tenant
 */
export async function GET(request: Request) {
    try {
        // Require authentication with tenant context
        const { session, tenantId } = await requireTenantAuth(request);

        // 1. Check Permissions
        let permissions = session.permissions || {};
        if (typeof permissions === 'string') {
            try {
                permissions = JSON.parse(permissions);
            } catch (e) {
                console.error('[LEADS_API] Failed to parse permissions:', e);
                permissions = {};
            }
        }

        // Support both granular and legacy "all:true" permissions
        const hasFullAccess = permissions.all === true;
        const viewScope = hasFullAccess ? 'all' : (permissions.leads?.view || permissions.leads?.read);

        console.log('[LEADS_API_DEBUG]', {
            userId: session.id,
            tenantId,
            role: session.tenantRole,
            permissions: JSON.stringify(permissions),
            hasFullAccess,
            viewScope
        });

        if (!viewScope || viewScope === false || viewScope === 'none') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        // 2. Build Query with Scope Logic
        let whereClause = "WHERE c.tenant_id = ?";
        const queryParams = [
            tenantId, // order_status subquery
            tenantId, // order_source subquery
            tenantId, // total_activities subquery
            tenantId, // new_activity_count subquery
            session.id, // admin_id for lead_reads
            tenantId, // lead_reads tenant
            tenantId, // orders join
            tenantId, // customers where - param 1
        ];

        // Apply Scope Filter
        if (viewScope === 'owned') {
            whereClause += " AND c.owner_id = ?";
            queryParams.push(session.id);
        } else if (viewScope === 'team') {
            // Future: Add team logic here. For now, strict owned check is safest fallback if team logic missing
            // But usually 'team' implies same department. 
            // If teams not implemented, this might behave like 'all' or 'owned' depending on business rule.
            // Let's assume 'all' for now unless strict team tables exist.
        }

        const connection = await pool.getConnection();
        try {
            // Schema Patch: Ensure customers and orders have required columns
            try { await connection.execute('ALTER TABLE customers ADD COLUMN company_id INT'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE orders ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE tasks ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }

            const [rows]: any = await connection.execute(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT o.id) as total_orders,
                    MAX(o.created_at) as last_order_date,
                    (SELECT status FROM orders WHERE customer_id = c.id AND tenant_id = ? ORDER BY created_at DESC LIMIT 1) as order_status,
                    (SELECT source FROM orders WHERE customer_id = c.id AND tenant_id = ? ORDER BY created_at DESC LIMIT 1) as order_source,
                    (SELECT COUNT(*) FROM interactions WHERE customer_id = c.id AND tenant_id = ?) as total_activities,
                    (SELECT COUNT(*) FROM interactions 
                     WHERE customer_id = c.id AND tenant_id = ?
                     AND created_at > COALESCE((SELECT MAX(last_read_at) FROM lead_reads WHERE lead_id = c.id AND admin_id = ? AND tenant_id = ?), '1970-01-01')) as new_activity_count
                FROM customers c
                LEFT JOIN orders o ON c.id = o.customer_id AND o.tenant_id = ?
                ${whereClause}
                GROUP BY c.id, c.created_at
                ORDER BY c.created_at DESC
            `, queryParams);

            return NextResponse.json(rows);
        } finally {
            connection.release();
        }
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message.includes('Tenant context required')) {
            return NextResponse.json({ error: 'Please select a workspace first' }, { status: 400 });
        }
        console.error("Fetch Leads Error:", error);
        return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/leads
 * Create a new lead in the current tenant
 */
export async function POST(request: Request) {
    try {
        // Require authentication with tenant context
        const { session, tenantId, tenantRole } = await requireTenantAuth(request);

        // Only members and above can create leads
        if (tenantRole === 'viewer') {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const {
            name, email, phone, source, location, budget,
            notes, platform, campaign_name, ad_name, company, project_desc
        } = body;

        if (!name || !email) {
            return NextResponse.json(
                { success: false, message: 'Name and Email are required' },
                { status: 400 }
            );
        }

        // Use tenant-scoped database for insert
        const db = getTenantDb(tenantId);

        const result = await db.insert('customers', {
            name,
            email,
            phone: phone || '',
            source: source || 'Manual',
            location: location || '',
            budget: budget || null,
            notes: notes || '',
            platform: platform || '',
            campaign_name: campaign_name || '',
            ad_name: ad_name || '',
            company: company || '',
            company_id: (body.company_id && !isNaN(parseInt(body.company_id))) ? parseInt(body.company_id) : null,
            project_desc: project_desc || '',
            stage: 'new',
            score: 'cold',
            created_by: session.id,  // MANDATORY: Track ownership
            owner_id: session.id,    // Assign to creator by default
        });

        const leadId = result.insertId;

        // Log Interaction
        try {
            await db.insert('interactions', {
                customer_id: leadId,
                type: 'system_event',
                content: `Lead created manually: ${name} (${email})`,
                created_by: session.id,
            });

            // Notify Owner if different from Creator
            // Default logic assigned owner_id = session.id above, but if we allow picking owner in future:
            // For now, let's assume if we add an 'owner_id' param to body, we notify them.
            // But currently code says owner_id: session.id. 
            // So this is just future proofing or if logic changes. 
            // Actually, let's notify the creator "Lead Created" is redundant. 
            // Let's leave this until we allow selecting owner on creation.
        } catch (e) {
            console.error("Failed to log lead creation interaction:", e);
        }

        return NextResponse.json({ success: true, id: leadId });
    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error("Create Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create lead' }, { status: 500 });
    }
}
