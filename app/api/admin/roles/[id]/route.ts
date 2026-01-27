import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId, permissions } = await requireTenantAuth(request);

        const canManageTeam = permissions?.team?.manage || ['owner', 'admin'].includes(session.tenantRole || '');
        if (!canManageTeam) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const connection = await pool.getConnection();
        try {
            const [roles]: any = await connection.execute(
                `SELECT * FROM tenant_roles WHERE id = ? AND tenant_id = ?`,
                [params.id, tenantId]
            );

            if (roles.length === 0) {
                return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, role: roles[0] });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId, permissions } = await requireTenantAuth(request);

        const canManageTeam = permissions?.team?.manage || ['owner', 'admin'].includes(session.tenantRole || '');
        if (!canManageTeam) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, permissions: rolePermissions } = body;
        const roleId = params.id;

        const connection = await pool.getConnection();
        try {
            // Check if role exists and get system status
            const [roles]: any = await connection.execute(
                'SELECT id, is_system, name FROM tenant_roles WHERE id = ? AND tenant_id = ?',
                [roleId, tenantId]
            );

            if (roles.length === 0) {
                return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
            }

            const currentRole = roles[0];

            // If system role, prevent renaming
            if (currentRole.is_system && name && name !== currentRole.name) {
                return NextResponse.json({ success: false, message: 'System roles cannot be renamed' }, { status: 400 });
            }

            // If updating name, check duplicates
            if (name && name !== currentRole.name) {
                const [existing]: any = await connection.execute(
                    'SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = ? AND id != ?',
                    [tenantId, name, roleId]
                );
                if (existing.length > 0) {
                    return NextResponse.json({ success: false, message: 'Role with this name already exists' }, { status: 409 });
                }
            }

            // Build dynamic update query
            const updates: string[] = [];
            const values: any[] = [];

            if (name) { updates.push('name = ?'); values.push(name); }
            if (description !== undefined) { updates.push('description = ?'); values.push(description); }
            if (rolePermissions) { updates.push('permissions = ?'); values.push(JSON.stringify(rolePermissions)); }

            if (updates.length === 0) {
                return NextResponse.json({ success: true, message: 'No changes' });
            }

            values.push(roleId);
            values.push(tenantId);

            await connection.execute(
                `UPDATE tenant_roles SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
                values
            );

            return NextResponse.json({ success: true, message: 'Role updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { session, tenantId, permissions } = await requireTenantAuth(request);

        const canManageTeam = permissions?.team?.manage || ['owner', 'admin'].includes(session.tenantRole || '');
        if (!canManageTeam) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const roleId = params.id;

        const connection = await pool.getConnection();
        try {
            // Check role status
            const [roles]: any = await connection.execute(
                'SELECT is_system FROM tenant_roles WHERE id = ? AND tenant_id = ?',
                [roleId, tenantId]
            );

            if (roles.length === 0) {
                return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
            }

            if (roles[0].is_system) {
                return NextResponse.json({ success: false, message: 'System roles cannot be deleted' }, { status: 400 });
            }

            // Check usage
            const [users]: any = await connection.execute(
                'SELECT COUNT(id) as count FROM tenant_users WHERE role_id = ?',
                [roleId]
            );

            if (users[0].count > 0) {
                return NextResponse.json({
                    success: false,
                    message: `Cannot delete role because ${users[0].count} users are assigned to it. Please reassign them first.`
                }, { status: 409 });
            }

            await connection.execute(
                'DELETE FROM tenant_roles WHERE id = ? AND tenant_id = ?',
                [roleId, tenantId]
            );

            return NextResponse.json({ success: true, message: 'Role deleted successfully' });
        } finally {
            connection.release();
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
