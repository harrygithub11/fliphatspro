import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - List all companies
export async function GET(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { searchParams } = new URL(request.url);

        const search = searchParams.get('search');
        const industry = searchParams.get('industry');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = `
            SELECT 
                c.*,
                u.name as owner_name,
                (SELECT COUNT(*) FROM customers WHERE company_id = c.id AND tenant_id = ? AND deleted_at IS NULL) as contact_count,
                (SELECT COUNT(*) FROM deals WHERE company_id = c.id AND tenant_id = ? AND deleted_at IS NULL) as deal_count
            FROM companies c
            LEFT JOIN users u ON c.owner_id = u.id
            WHERE c.tenant_id = ? AND c.deleted_at IS NULL
        `;
        const params: any[] = [tenantId, tenantId, tenantId];

        if (search) {
            query += ' AND (c.name LIKE ? OR c.domain LIKE ? OR c.industry LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (industry) {
            query += ' AND c.industry = ?';
            params.push(industry);
        }

        query += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;



        const connection = await pool.getConnection();
        try {
            // Schema Patch: Ensure customers and deals have required columns
            try { await connection.execute('ALTER TABLE customers ADD COLUMN company_id INT'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE deals ADD COLUMN company_id INT'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }
            try { await connection.execute('ALTER TABLE deals ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('dberr', e.message); }

            // Self-healing: Create table if it doesn't exist
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS companies (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    tenant_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    domain VARCHAR(255),
                    industry VARCHAR(100),
                    size VARCHAR(50),
                    website VARCHAR(255),
                    phone VARCHAR(50),
                    address TEXT,
                    city VARCHAR(100),
                    state VARCHAR(100),
                    country VARCHAR(100),
                    postal_code VARCHAR(50),
                    logo_url TEXT,
                    linkedin_url VARCHAR(255),
                    annual_revenue VARCHAR(100),
                    employee_count INT,
                    tags JSON,
                    owner_id INT,
                    created_by INT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    deleted_at DATETIME NULL,
                    INDEX idx_tenant (tenant_id),
                    INDEX idx_owner (owner_id),
                    INDEX idx_domain (domain)
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
            `);

            const [companies]: any = await connection.query(query, params);

            // Get industries for filter
            const [industries]: any = await connection.execute(`
                SELECT DISTINCT industry FROM companies 
                WHERE tenant_id = ? AND industry IS NOT NULL AND industry != ''
                ORDER BY industry
            `, [tenantId]);

            // Get stats
            const [stats]: any = await connection.execute(`
                SELECT 
                    COUNT(*) as total_companies,
                    SUM(CASE WHEN size = '1000+' OR size = '501-1000' THEN 1 ELSE 0 END) as enterprise_count,
                    SUM(annual_revenue) as total_revenue
                FROM companies
                WHERE tenant_id = ?
            `, [tenantId]);

            return NextResponse.json({
                success: true,
                companies,
                industries: industries.map((i: any) => i.industry),
                stats: stats[0] || {}
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Companies Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch companies' }, { status: 500 });
    }
}

// POST - Create company
export async function POST(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const body = await request.json();

        const {
            name, domain, industry, size, website, phone,
            address, city, state, country, postal_code,
            logo_url, linkedin_url, annual_revenue, employee_count,
            tags, owner_id
        } = body;

        if (!name) {
            return NextResponse.json({ success: false, message: 'Company name is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [res]: any = await connection.execute(`
                INSERT INTO companies (
                    tenant_id, name, domain, industry, size, website, phone,
                    address, city, state, country, postal_code,
                    logo_url, linkedin_url, annual_revenue, employee_count, tags, owner_id, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                tenantId, name, domain || null, industry || null, size || null,
                website || null, phone || null, address || null, city || null,
                state || null, country || null, postal_code || null,
                logo_url || null, linkedin_url || null, annual_revenue || null,
                employee_count || null, tags ? JSON.stringify(tags) : null, owner_id || session.id,
                session.id  // MANDATORY: Track ownership
            ]);

            const companyId = res.insertId;

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'company_create',
                `Created company: "${name}"`,
                'company',
                companyId
            );

            return NextResponse.json({ success: true, companyId });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Company Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create company' }, { status: 500 });
    }
}

// PUT - Update company
export async function PUT(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Company ID is required' }, { status: 400 });
        }

        const allowedFields = [
            'name', 'domain', 'industry', 'size', 'website', 'phone',
            'address', 'city', 'state', 'country', 'postal_code',
            'logo_url', 'linkedin_url', 'annual_revenue', 'employee_count', 'tags', 'owner_id'
        ];

        const filteredUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                filteredUpdates[key] = key === 'tags' ? JSON.stringify(value) : value;
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return NextResponse.json({ success: false, message: 'No valid fields to update' }, { status: 400 });
        }

        const keys = Object.keys(filteredUpdates);
        const values = Object.values(filteredUpdates);
        const setClause = keys.map(k => `${k} = ?`).join(', ');

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
                [...values, id, tenantId]
            );

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'company_update',
                `Updated company #${id}`,
                'company',
                id
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Company Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update company' }, { status: 500 });
    }
}

// DELETE - Remove company
export async function DELETE(request: Request) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'Company ID is required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            const [companies]: any = await connection.execute(
                'SELECT name FROM companies WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            if (companies.length === 0) {
                return NextResponse.json({ success: false, message: 'Company not found' }, { status: 404 });
            }

            // SOFT DELETE: Set deleted_at instead of hard delete (compliance)
            await connection.execute(
                'UPDATE companies SET deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'company_delete',
                `Deleted company: "${companies[0].name}"`,
                'company',
                parseInt(id)
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Delete Company Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to delete company' }, { status: 500 });
    }
}
