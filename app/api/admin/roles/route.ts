import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const { session, tenantId, permissions } = await requireTenantAuth(request);

        // Check permissions safely
        const canManageTeam = permissions?.team?.manage || ['owner', 'admin'].includes(session.tenantRole || '');
        if (!canManageTeam) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const connection = await pool.getConnection();
        try {
            // Fetch roles with user count
            const [roles]: any = await connection.execute(
                `SELECT r.*, COUNT(u.id) as user_count 
                 FROM tenant_roles r
                 LEFT JOIN tenant_users u ON r.id = u.role_id
                 WHERE r.tenant_id = ?
                 GROUP BY r.id
                 ORDER BY r.is_system DESC, r.name ASC`,
                [tenantId]
            );

            return NextResponse.json({ success: true, roles });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Fetch Roles Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { session, tenantId, permissions } = await requireTenantAuth(request);

        // Check permissions safely
        const canManageTeam = permissions?.team?.manage || ['owner', 'admin'].includes(session.tenantRole || '');
        if (!canManageTeam) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, permissions: rolePermissions } = body;

        if (!name || !rolePermissions) {
            return NextResponse.json({ success: false, message: 'Name and permissions are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Check for duplicate name
            const [existing]: any = await connection.execute(
                'SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = ?',
                [tenantId, name]
            );

            if (existing.length > 0) {
                return NextResponse.json({ success: false, message: 'Role with this name already exists' }, { status: 409 });
            }

            // Create Role
            const [res]: any = await connection.execute(
                `INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system) 
                 VALUES (?, ?, ?, ?, FALSE)`,
                [tenantId, name, description || '', JSON.stringify(rolePermissions)]
            );

            return NextResponse.json({
                success: true,
                message: 'Role created successfully',
                roleId: res.insertId
            });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Create Role Error:', error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
