import { NextResponse } from 'next/server';
import { requireTenantAuth } from '@/lib/auth';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET current logged-in user info with tenant context
export async function GET(request: Request) {
    try {
        // Use requireTenantAuth to get context-aware session
        const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(request);

        // Fetch extra profile details (avatar, dates)
        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute(
                'SELECT avatar_url, created_at, last_login FROM users WHERE id = ?',
                [session.id]
            );

            const userDetails = rows.length > 0 ? rows[0] : {};

            // Fetch Tenant Settings (Features)
            const [settingRows]: any = await connection.execute(
                "SELECT setting_key, setting_value FROM tenant_settings WHERE tenant_id = ?",
                [tenantId]
            );

            const features: Record<string, boolean> = {
                crm: true, // Default true
                projects: true, // Default true
                helpdesk: false // Default false
            };

            if (settingRows.length > 0) {
                settingRows.forEach((row: any) => {
                    if (row.setting_key === 'feature_crm') features.crm = row.setting_value === 'true';
                    if (row.setting_key === 'feature_projects') features.projects = row.setting_value === 'true';
                    if (row.setting_key === 'feature_helpdesk') features.helpdesk = row.setting_value === 'true';
                });
            }

            return NextResponse.json({
                success: true,
                admin: {
                    id: session.id,
                    name: session.name,
                    email: session.email,
                    avatar_url: userDetails.avatar_url,
                    created_at: userDetails.created_at,
                    last_login: userDetails.last_login,
                    // Contextual Info
                    tenantId: tenantId,
                    role: tenantRole, // This is the role ID/slug
                    permissions: permissions, // This is the granular permission object
                    features: features // Enabled modules
                }
            });
        } finally {
            connection.release();
        }

    } catch (error: any) {
        // If requireTenantAuth fails (no tenant selected), fall back to basic user info
        // This allows the UI to handle the "Select Tenant" state
        if (error.message.includes('Tenant context required')) {
            return NextResponse.json({ success: false, message: 'No tenant selected', requiresTenantSelection: true }, { status: 200 });
        }

        console.error("Get Current User Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
