/**
 * Tenant Context Management
 * 
 * Provides utilities for resolving, setting, and accessing tenant context
 * throughout the application.
 */

import { cookies } from 'next/headers';
import pool from './db';

// ============================================
// TYPES
// ============================================

export type TenantRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TenantPlan = 'free' | 'starter' | 'professional' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'archived';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    plan: TenantPlan;
    status: TenantStatus;
    ownerId: number | null;
    logoUrl: string | null;
    domain: string | null;
    settings: Record<string, any> | null;
    createdAt: Date;
}

export interface TenantContext {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    tenantPlan: TenantPlan;
    userRole: TenantRole;
}

export interface TenantMembership {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantPlan: TenantPlan;
    tenantLogo?: string | null;
    role: TenantRole;
    permissions: any; // RBAC Permissions
    joinedAt: Date;
    subscriptionStatus?: string;
}

// ============================================
// CONSTANTS
// ============================================

const TENANT_COOKIE_NAME = 'current_tenant_id';
const TENANT_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
};

// ============================================
// TENANT RESOLUTION
// ============================================

/**
 * Resolve tenant from request (subdomain or path)
 */
export async function resolveTenantFromRequest(request: Request): Promise<TenantContext | null> {
    const url = new URL(request.url);

    // Option 1: Subdomain resolution (acme.app.com)
    const hostname = url.hostname;
    const parts = hostname.split('.');

    // Check if it's a subdomain (not www, not localhost, not IP)
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
        const subdomain = parts[0];
        const tenant = await getTenantBySlug(subdomain);
        if (tenant) {
            return tenant;
        }
    }

    // Option 2: Path-based resolution (/app/acme/...)
    const pathMatch = url.pathname.match(/^\/app\/([^\/]+)/);
    if (pathMatch) {
        const slug = pathMatch[1];
        const tenant = await getTenantBySlug(slug);
        if (tenant) {
            return tenant;
        }
    }

    // Option 3: Check cookie for previously selected tenant
    const cookieStore = cookies();
    const tenantIdFromCookie = cookieStore.get(TENANT_COOKIE_NAME)?.value;
    if (tenantIdFromCookie) {
        const tenant = await getTenantById(tenantIdFromCookie);
        if (tenant) {
            return tenant;
        }
    }

    return null;
}

/**
 * Get tenant by slug
 */
export async function getTenantBySlug(slug: string): Promise<TenantContext | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT id, name, slug, plan, status FROM tenants WHERE slug = ? AND status = 'active'`,
            [slug]
        );

        if (rows.length === 0) return null;

        const tenant = rows[0];
        return {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            tenantName: tenant.name,
            tenantPlan: tenant.plan,
            userRole: 'member', // Will be updated with actual user role
        };
    } finally {
        connection.release();
    }
}

/**
 * Get tenant by ID
 */
export async function getTenantById(tenantId: string): Promise<TenantContext | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT id, name, slug, plan, status FROM tenants WHERE id = ? AND status = 'active'`,
            [tenantId]
        );

        if (rows.length === 0) return null;

        const tenant = rows[0];
        return {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            tenantName: tenant.name,
            tenantPlan: tenant.plan,
            userRole: 'member',
        };
    } finally {
        connection.release();
    }
}

/**
 * Get full tenant details
 */
export async function getFullTenant(tenantId: string): Promise<Tenant | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT * FROM tenants WHERE id = ?`,
            [tenantId]
        );

        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            plan: row.plan,
            status: row.status,
            ownerId: row.owner_id,
            logoUrl: row.logo_url,
            domain: row.domain,
            settings: row.settings ? JSON.parse(row.settings) : null,
            createdAt: row.created_at,
        };
    } finally {
        connection.release();
    }
}

// ============================================
// USER TENANT MEMBERSHIP
// ============================================

/**
 * Get all tenants a user belongs to
 */

export async function getUserTenants(userId: number): Promise<TenantMembership[]> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT 
                t.id as tenant_id,
                t.name as tenant_name,
                t.slug as tenant_slug,
                t.plan as tenant_plan,
                t.logo_url as tenant_logo,
                tu.role,
                tr.permissions,
                tu.joined_at,
                s.status as subscription_status
            FROM tenant_users tu
            JOIN tenants t ON tu.tenant_id = t.id
            LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
            LEFT JOIN subscriptions s ON t.id = s.company_id
            WHERE tu.user_id = ? AND t.status = 'active'
            ORDER BY tu.joined_at ASC`,
            [userId]
        );

        return rows.map((row: any) => {
            let permissions = row.permissions;
            if (!permissions) {
                const defaultRole = DEFAULT_RBAC_ROLES.find(r => r.name.toLowerCase() === row.role);
                if (defaultRole) {
                    permissions = defaultRole.permissions;
                }
            }
            return {
                tenantId: row.tenant_id,
                tenantName: row.tenant_name,
                tenantSlug: row.tenant_slug,
                tenantPlan: row.tenant_plan,
                tenantLogo: row.tenant_logo,
                subscriptionStatus: row.subscription_status || 'inactive', // Default to inactive if no sub
                role: row.role,
                permissions: permissions || {}, // Fallback to empty object
                joinedAt: row.joined_at,
            };
        });
    } finally {
        connection.release();
    }
}

/**
 * Get user's role in a specific tenant
 */
export async function getUserTenantRole(userId: number, tenantId: string): Promise<TenantRole | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT role FROM tenant_users WHERE user_id = ? AND tenant_id = ?`,
            [userId, tenantId]
        );

        if (rows.length === 0) return null;
        return rows[0].role as TenantRole;
    } finally {
        connection.release();
    }
}

/**
 * Get user's role and permissions in a specific tenant
 */
export async function getUserTenantAccess(userId: number, tenantId: string): Promise<{ role: TenantRole; permissions: any } | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            `SELECT tu.role, tr.permissions
             FROM tenant_users tu
             LEFT JOIN tenant_roles tr ON tu.role_id = tr.id
             WHERE tu.user_id = ? AND tu.tenant_id = ?`,
            [userId, tenantId]
        );

        if (rows.length === 0) return null;

        const role = rows[0].role as TenantRole;
        let permissions = rows[0].permissions;

        // Fallback for legacy users without role_id or empty permissions
        const isEmpty = !permissions || (typeof permissions === 'object' && Object.keys(permissions).length === 0);

        if (isEmpty) {
            console.log(`[AUTH_FIX] Missing permissions for user ${userId} in tenant ${tenantId} (Role: ${role}). Applying default.`);
            const defaultRole = DEFAULT_RBAC_ROLES.find(r => r.name.toLowerCase() === role);
            if (defaultRole) {
                permissions = defaultRole.permissions;
            }
        }

        return {
            role,
            permissions: permissions || {}
        };
    } finally {
        connection.release();
    }
}

/**
 * Check if user has access to tenant
 */
export async function userHasTenantAccess(userId: number, tenantId: string): Promise<boolean> {
    const role = await getUserTenantRole(userId, tenantId);
    return role !== null;
}

// ============================================
// CURRENT TENANT CONTEXT
// ============================================

/**
 * Get current tenant ID from cookie
 */
export function getCurrentTenantId(): string | null {
    try {
        const cookieStore = cookies();
        return cookieStore.get(TENANT_COOKIE_NAME)?.value || null;
    } catch {
        // Called outside of request context
        return null;
    }
}

/**
 * Set current tenant context (stored in cookie)
 */
export function setCurrentTenant(tenantId: string): void {
    try {
        const cookieStore = cookies();
        cookieStore.set(TENANT_COOKIE_NAME, tenantId, TENANT_COOKIE_OPTIONS);
    } catch (error) {
        console.error('Failed to set tenant cookie:', error);
    }
}

/**
 * Clear current tenant context
 */
export function clearCurrentTenant(): void {
    try {
        const cookieStore = cookies();
        cookieStore.delete(TENANT_COOKIE_NAME);
    } catch (error) {
        console.error('Failed to clear tenant cookie:', error);
    }
}

// ============================================
// TENANT CREATION
// ============================================

/**
 * Create a new tenant
 */
const DEFAULT_RBAC_ROLES = [
    {
        name: 'Owner',
        description: 'Full access to workspace. Cannot be deleted.',
        is_system: true,
        permissions: {
            contacts: { view: 'all', edit: 'all', delete: 'all', export: true },
            leads: { view: 'all', edit: 'all', delete: 'all', export: true },
            deals: { view: 'all', edit: 'all', delete: 'all' },
            team: { manage: true, invite: true },
            settings: { billing: true, system: true }
        }
    },
    {
        name: 'Admin',
        description: 'Managerial access. Can manage team but not billing.',
        is_system: true,
        permissions: {
            contacts: { view: 'all', edit: 'all', delete: 'all', export: true },
            leads: { view: 'all', edit: 'all', delete: 'all', export: true },
            deals: { view: 'all', edit: 'all', delete: 'all' },
            team: { manage: true, invite: true },
            settings: { billing: false, system: true }
        }
    },
    {
        name: 'Member',
        description: 'Standard access. Can view and edit owned records.',
        is_system: false,
        permissions: {
            contacts: { view: 'team', edit: 'owned', delete: false, export: false },
            leads: { view: 'team', edit: 'owned', delete: false, export: false },
            deals: { view: 'team', edit: 'owned', delete: false },
            team: { manage: false, invite: false },
            settings: { billing: false, system: false }
        }
    },
    {
        name: 'Viewer',
        description: 'Read-only access to workspace.',
        is_system: false,
        permissions: {
            contacts: { view: 'team', edit: false, delete: false, export: false },
            leads: { view: 'team', edit: false, delete: false, export: false },
            deals: { view: 'team', edit: false, delete: false },
            team: { manage: false, invite: false },
            settings: { billing: false, system: false }
        }
    }
];

/**
 * Create a new tenant
 */
export async function createTenant(
    name: string,
    slug: string,
    ownerId: number,
    plan: TenantPlan = 'free'
): Promise<Tenant> {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const tenantId = crypto.randomUUID();

        // 1. Create tenant
        await connection.execute(
            `INSERT INTO tenants (id, name, slug, plan, owner_id, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'active', NOW(), NOW())`,
            [tenantId, name, slug, plan, ownerId]
        );

        // 2. Seed Default Roles
        let ownerRoleId = null;

        for (const roleDef of DEFAULT_RBAC_ROLES) {
            const [res]: any = await connection.execute(
                `INSERT INTO tenant_roles (tenant_id, name, description, permissions, is_system, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
                [tenantId, roleDef.name, roleDef.description, JSON.stringify(roleDef.permissions), roleDef.is_system]
            );

            if (roleDef.name === 'Owner') {
                ownerRoleId = res.insertId;
            }
        }

        // 3. Add owner as tenant user with role_id
        await connection.execute(
            `INSERT INTO tenant_users (tenant_id, user_id, role, role_id, joined_at)
             VALUES (?, ?, 'owner', ?, NOW())`,
            [tenantId, ownerId, ownerRoleId]
        );

        // 4. Seed Subscription
        await connection.execute(
            `INSERT INTO subscriptions (id, company_id, plan, status, start_date, created_at, updated_at)
             VALUES (?, ?, ?, 'active', NOW(), NOW(), NOW())`,
            [crypto.randomUUID(), tenantId, plan]
        );

        // 5. Log the creation
        await connection.execute(
            `INSERT INTO tenant_audit_logs (tenant_id, user_id, action, entity_type, entity_id, new_values)
             VALUES (?, ?, 'TENANT_CREATED', 'tenant', ?, ?)`,
            [tenantId, ownerId, tenantId, JSON.stringify({ name, slug, plan })]
        );

        await connection.commit();

        return {
            id: tenantId,
            name,
            slug,
            plan,
            status: 'active',
            ownerId,
            logoUrl: null,
            domain: null,
            settings: null,
            createdAt: new Date(),
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// ============================================
// ROLE PERMISSIONS
// ============================================

const ROLE_HIERARCHY: Record<TenantRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1,
};

/**
 * Check if role has at least the required permission level
 */
export function hasRolePermission(userRole: TenantRole, requiredRole: TenantRole): boolean {
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
    userRole: TenantRole,
    action: 'read' | 'write' | 'delete' | 'admin' | 'owner'
): boolean {
    switch (action) {
        case 'read':
            return hasRolePermission(userRole, 'viewer');
        case 'write':
            return hasRolePermission(userRole, 'member');
        case 'delete':
            return hasRolePermission(userRole, 'admin');
        case 'admin':
            return hasRolePermission(userRole, 'admin');
        case 'owner':
            return hasRolePermission(userRole, 'owner');
        default:
            return false;
    }
}
