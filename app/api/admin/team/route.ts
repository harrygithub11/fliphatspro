
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all team members (NEW SCHEMA)
export async function GET(request: Request) {
    try {
        const { tenantId } = await requireTenantAuth(request);
        const connection = await pool.getConnection();

        try {
            // Join users and tenant_users
            const [members]: any = await connection.execute(`
                SELECT u.id, u.name, u.email, u.avatar_url, u.last_login, u.created_at,
                       tu.role, tu.joined_at
                FROM users u
                INNER JOIN tenant_users tu ON u.id = tu.user_id
                WHERE tu.tenant_id = ?
                ORDER BY u.name ASC
            `, [tenantId]);

            return NextResponse.json(members);
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Team Error:", error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

// POST - Add team member (NEW SCHEMA)
export async function POST(request: Request) {
    try {
        const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(request);

        console.log('Team POST Auth:', { tenantId, tenantRole, permissions });

        // Check Permissions (RBAC) - Allow if has team.manage OR team.invite
        // Also allow legacy 'owner'/'admin' just in case permissions are missing
        const hasPermission =
            permissions?.team?.manage ||
            permissions?.team?.invite ||
            tenantRole === 'owner' ||
            tenantRole === 'admin';

        if (!hasPermission) {
            return NextResponse.json({ success: false, message: 'Insufficient permissions to invite users' }, { status: 403 });
        }

        const body = await request.json();
        const { email, name, password, role } = body;

        if (!email || !name || !password) {
            return NextResponse.json({ success: false, message: 'Values missing' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Check if user exists globally
            const [existing]: any = await connection.execute(
                'SELECT id, password_hash, name FROM users WHERE email = ?',
                [email]
            );

            let userId;

            // Safe bcrypt import
            const bcrypt = await import('bcryptjs');

            if (existing.length > 0) {
                // User exists
                userId = existing[0].id;

                // Check if already in tenant
                const [inTenant]: any = await connection.execute(
                    'SELECT id FROM tenant_users WHERE tenant_id = ? AND user_id = ?',
                    [tenantId, userId]
                );

                if (inTenant.length > 0) {
                    await connection.rollback();
                    return NextResponse.json({ success: false, message: 'User already in this workspace' }, { status: 400 });
                }

                // If existing user has different name, maybe don't overwrite? 
                // But for simplicity/invite flow, we might just link them.
            } else {
                // Create new user
                const passwordHash = await bcrypt.hash(password, 10);

                const [result]: any = await connection.execute(
                    'INSERT INTO users (email, name, password_hash, created_at) VALUES (?, ?, ?, NOW())',
                    [email, name, passwordHash]
                );
                userId = result.insertId;
            }

            // 2. Lookup role_id
            const requestedRoleName = role || 'Member';
            const [roleRows]: any = await connection.execute(
                'SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = ?',
                [tenantId, requestedRoleName]
            );

            let roleId = null;
            if (roleRows.length > 0) {
                roleId = roleRows[0].id;
            } else {
                // Fallback to 'Member' or 'Viewer' if not found
                const [defaultRole]: any = await connection.execute(
                    'SELECT id FROM tenant_roles WHERE tenant_id = ? AND name = ?',
                    [tenantId, 'Member']
                );
                if (defaultRole.length > 0) roleId = defaultRole[0].id;
            }

            // 3. Determine Legacy Enum Value (fallback for 'role' column)
            // The 'role' column is ENUM('owner', 'admin', 'member', 'viewer')
            // If the custom role is not one of these, we default to 'member' to satisfy DB constraint.
            const validEnums = ['owner', 'admin', 'member', 'viewer'];
            const legacyRole = validEnums.includes(requestedRoleName.toLowerCase())
                ? requestedRoleName.toLowerCase()
                : 'member';

            // 4. Add to tenant_users
            await connection.execute(
                'INSERT INTO tenant_users (tenant_id, user_id, role, role_id, joined_at) VALUES (?, ?, ?, ?, NOW())',
                [tenantId, userId, legacyRole, roleId]
            );

            await connection.commit();

            // Log activity
            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'team_invite',
                `Added team member ${name} (${email}) as ${role}`,
                'user',
                userId
            );

            return NextResponse.json({
                success: true,
                message: 'User added successfully'
            });

        } catch (error: any) {
            await connection.rollback();
            console.error('Create Team Member SQL Error:', error);
            return NextResponse.json({ success: false, message: 'DB Error: ' + error.message });
        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error("Create Team Member Error:", error);
        return NextResponse.json({ success: false, message: 'Server Error: ' + error.message }, { status: 500 });
    }
}
