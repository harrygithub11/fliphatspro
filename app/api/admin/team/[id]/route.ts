
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);
        const userIdToFetch = parseInt(params.id);

        if (isNaN(userIdToFetch)) {
            return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Get user details with role for this tenant
            const [rows]: any = await connection.execute(
                `SELECT 
                    u.id, u.name, u.email, u.avatar_url, u.last_login,
                    tu.role as legacy_role, tu.joined_at, tu.permissions,
                    COALESCE(tr.name, tu.role) as role,
                    tr.id as role_id,
                    tr.is_system
                 FROM tenant_users tu
                 JOIN users u ON tu.user_id = u.id
                 LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
                 WHERE tu.tenant_id = ? AND tu.user_id = ?`,
                [tenantId, userIdToFetch]
            );

            if (rows.length === 0) {
                return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, user: rows[0] });

        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Get Member Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId, tenantRole, session } = await requireTenantAuth(request);
        const userIdToRemove = parseInt(params.id);

        if (isNaN(userIdToRemove)) {
            return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        // Only owners/admins can remove
        if (tenantRole !== 'owner' && tenantRole !== 'admin') {
            return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
        }

        // Cannot remove yourself
        if (userIdToRemove === session.id) {
            return NextResponse.json({ success: false, message: 'Cannot remove yourself' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Check target user role (Member cannot remove Admin/Owner?)
            const [target]: any = await connection.execute(
                'SELECT role FROM tenant_users WHERE tenant_id = ? AND user_id = ?',
                [tenantId, userIdToRemove]
            );

            if (target.length === 0) {
                return NextResponse.json({ success: false, message: 'User not found in this workspace' }, { status: 404 });
            }

            const targetRole = target[0].role;

            // Rules:
            // Owner can remove anyone.
            // Admin can remove members/viewers, but NOT Owners.
            if (targetRole === 'owner') {
                return NextResponse.json({ success: false, message: 'Cannot remove the Workspace Owner' }, { status: 403 });
            }

            if (tenantRole === 'admin' && targetRole === 'admin') {
                // Optional: Admin removing another Admin? strict: no.
                // For now allow it, or restrict. Let's restrict.
                // return NextResponse.json({ success: false, message: 'Admins cannot remove other Admins' }, { status: 403 });
            }

            // Perform removal
            await connection.execute(
                'DELETE FROM tenant_users WHERE tenant_id = ? AND user_id = ?',
                [tenantId, userIdToRemove]
            );

            return NextResponse.json({ success: true, message: 'User removed from workspace' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Remove Member Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to remove user' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { tenantId, tenantRole } = await requireTenantAuth(request);
        const userIdToUpdate = parseInt(params.id);

        if (isNaN(userIdToUpdate)) {
            return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        // Only owners/admins can update
        if (tenantRole !== 'owner' && tenantRole !== 'admin') {
            return NextResponse.json({ success: false, message: 'Insufficient permissions' }, { status: 403 });
        }

        const body = await request.json();
        const { password, role } = body;

        if (!password && !role) {
            return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // 1. Verify target user exists in this tenant
            const [target]: any = await connection.execute(
                'SELECT role FROM tenant_users WHERE tenant_id = ? AND user_id = ?',
                [tenantId, userIdToUpdate]
            );

            if (target.length === 0) {
                return NextResponse.json({ success: false, message: 'User not found in this workspace' }, { status: 404 });
            }

            const targetCurrentRole = target[0].role;
            // Prevent modifying Owner if you are not the Owner (simplification: only Owner can touch Owner)
            if (targetCurrentRole === 'owner' && tenantRole !== 'owner') {
                return NextResponse.json({ success: false, message: 'Cannot modify the Workspace Owner' }, { status: 403 });
            }

            // 2. Update Role
            if (role) {
                // Lookup role_id from tenant_roles
                const [roleRows]: any = await connection.execute(
                    'SELECT id, is_system FROM tenant_roles WHERE tenant_id = ? AND name = ?',
                    [tenantId, role]
                );

                if (roleRows.length === 0) {
                    return NextResponse.json({ success: false, message: 'Invalid role name' }, { status: 400 });
                }

                const newRoleId = roleRows[0].id;

                // Validate Ownership Transfer
                if (role === 'Owner' && tenantRole !== 'owner') {
                    // Note: System roles are usually capitalized 'Owner', check DB exact match logic if Case Sensitive
                    // Assuming 'Owner' is the name in DB for system owner.
                    return NextResponse.json({ success: false, message: 'Only Owner can transfer ownership' }, { status: 403 });
                }

                // Determine Legacy Fallback
                const validEnums = ['owner', 'admin', 'member', 'viewer'];
                const legacyRole = validEnums.includes(role.toLowerCase())
                    ? role.toLowerCase()
                    : 'member';

                await connection.execute(
                    'UPDATE tenant_users SET role = ?, role_id = ? WHERE tenant_id = ? AND user_id = ?',
                    [legacyRole, newRoleId, tenantId, userIdToUpdate]
                );
            }

            // 3. Update Password
            if (password) {
                const bcrypt = await import('bcryptjs');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);

                // Update users table
                await connection.execute(
                    'UPDATE users SET password_hash = ? WHERE id = ?',
                    [hashedPassword, userIdToUpdate]
                );

                // Update legacy admins table if exists (for backward compat)
                await connection.execute(
                    'UPDATE admins SET password_hash = ? WHERE id = ?',
                    [hashedPassword, userIdToUpdate]
                ).catch(() => { });
            }

            return NextResponse.json({ success: true, message: 'User updated successfully' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Update Member Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
    }
}
