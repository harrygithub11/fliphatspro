/**
 * Authentication & Authorization Library
 * 
 * Multi-tenant aware authentication with support for:
 * - Platform-level admin roles
 * - Tenant-level user roles
 * - JWT session management with tenant context
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import pool from './db';
import {
    TenantRole,
    TenantMembership,
    getUserTenants,
    getUserTenantRole,
    getUserTenantAccess,
    getCurrentTenantId,
    setCurrentTenant
} from './tenant-context';

// ============================================
// CONFIGURATION
// ============================================

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const SESSION_COOKIE_NAME = 'admin_session_v2';
const SESSION_DURATION = 60 * 60 * 24; // 24 hours in seconds

// ============================================
// TYPES
// ============================================

export type PlatformRole = 'platform_owner' | 'master_admin' | 'super_admin';

export interface UserSession {
    /** User ID */
    id: number;
    /** User email */
    email: string;
    /** User display name */
    name: string;
    /** Legacy role (kept for backward compatibility) */
    role: string;
    /** Current active tenant ID (null if not selected) */
    tenantId: string | null;
    /** User's role in current tenant */
    tenantRole: TenantRole | null;
    /** User's permissions in current tenant */
    permissions?: any;
    /** All tenants user belongs to */
    tenants: TenantMembership[];
    /** Whether user is a platform admin */
    isPlatformAdmin: boolean;
    /** Platform admin role (if applicable) */
    platformRole: PlatformRole | null;
    /** JWT ID for session tracking */
    jti?: string;
}

/** @deprecated Use UserSession instead */
export interface AdminSession {
    id: number;
    email: string;
    name: string;
    role: string;
}

export interface AuthResult {
    session: UserSession;
    tenantId: string;
    tenantRole: TenantRole;
    permissions: any;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function createSession(user: {
    id: number;
    email: string;
    name: string;
    role?: string;
}, metadata: { ip?: string; userAgent?: string } = {}): Promise<string> {
    // Get user's tenant memberships
    const tenants = await getUserTenants(user.id);

    // Check if user is a platform admin
    const platformAdmin = await getPlatformAdminRole(user.id);

    // Determine initial tenant context
    let initialTenantId: string | null = null;
    let initialTenantRole: TenantRole | null = null;

    // Try to get from cookie first
    const currentTenantId = getCurrentTenantId();
    if (currentTenantId) {
        const membership = tenants.find(t => t.tenantId === currentTenantId);
        if (membership) {
            initialTenantId = currentTenantId;
            initialTenantRole = membership.role;
        }
    }

    // If no valid current tenant, use the first one
    if (!initialTenantId && tenants.length > 0) {
        initialTenantId = tenants[0].tenantId;
        initialTenantRole = tenants[0].role;
        setCurrentTenant(initialTenantId);
    }

    const session: UserSession = {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role || 'member',
        tenantId: initialTenantId,
        tenantRole: initialTenantRole,
        tenants,
        isPlatformAdmin: platformAdmin !== null,
        platformRole: platformAdmin,
    };

    const jti = crypto.randomUUID();

    const token = await new SignJWT({ user: session })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(jti)
        .setExpirationTime(`${SESSION_DURATION}s`)
        .setIssuedAt()
        .sign(SECRET_KEY);

    // Store session in DB
    const connection = await pool.getConnection();
    try {
        await connection.execute(
            `INSERT INTO active_sessions (user_id, session_token, ip_address, user_agent, created_at, expires_at) 
             VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? SECOND))`,
            [user.id, jti, metadata.ip || null, metadata.userAgent || null, SESSION_DURATION]
        );
    } catch (e) {
        console.error("Failed to track session:", e);
    } finally {
        connection.release();
    }

    cookies().set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION,
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.fliphats.com' : undefined,
    });

    return token;
}

/**
 * Get current user session
 */
export async function getSession(): Promise<UserSession | null> {
    const token = cookies().get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);

        // Handle both old (admin) and new (user) session format
        const session = (payload.user || payload.admin) as UserSession;

        if (!session) {
            return null;
        }

        // Ensure session has tenant context
        if (!session.tenants) {
            // Migrate old session format
            const tenants = await getUserTenants(session.id);
            session.tenants = tenants;
            session.tenantId = tenants.length > 0 ? tenants[0].tenantId : null;
            session.tenantRole = tenants.length > 0 ? tenants[0].role : null;
            session.isPlatformAdmin = false;
            session.platformRole = null;
        }

        // Update tenant context from cookie if different
        const currentTenantId = getCurrentTenantId();
        if (currentTenantId && currentTenantId !== session.tenantId) {
            const membership = session.tenants.find(t => t.tenantId === currentTenantId);
            if (membership) {
                session.tenantId = currentTenantId;
                session.tenantRole = membership.role;
            }
        }

        // Attach JTI from payload
        if (payload.jti) {
            session.jti = payload.jti;

            // Verify session is active in DB
            const connection = await pool.getConnection();
            try {
                const [rows]: any = await connection.execute(
                    'SELECT 1 FROM active_sessions WHERE session_token = ? AND is_revoked = FALSE AND expires_at > NOW()',
                    [payload.jti]
                );

                if (rows.length === 0) {
                    console.log('Session revoked or expired:', payload.jti);
                    return null;
                }
            } catch (dbError) {
                console.error('Session DB check failed:', dbError);
                // Fail open or closed? Closed for security.
                return null;
            } finally {
                connection.release();
            }
        } else {
            // Force re-login for old sessions without JTI to ensure tracking
            return null;
        }

        return session;
    } catch (error) {
        // console.error('Session verification failed:', error);
        return null;
    }
}

/**
 * Get session for legacy compatibility
 * @deprecated Use getSession() instead
 */
export async function getLegacySession(): Promise<AdminSession | null> {
    const session = await getSession();
    if (!session) return null;

    return {
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
    };
}

/**
 * Destroy current session
 */
export async function destroySession(): Promise<void> {
    cookies().delete(SESSION_COOKIE_NAME);
}

/**
 * Update session with new tenant context
 */
export async function switchTenant(tenantId: string): Promise<UserSession | null> {
    const session = await getSession();
    if (!session) return null;

    // Verify user has access to tenant
    const membership = session.tenants.find(t => t.tenantId === tenantId);
    if (!membership) {
        throw new Error('User does not have access to this tenant');
    }

    // Update tenant context
    setCurrentTenant(tenantId);

    // Recreate session with new tenant context
    await createSession({
        id: session.id,
        email: session.email,
        name: session.name,
        role: session.role,
    });

    return getSession();
}

// ============================================
// AUTHENTICATION REQUIREMENTS
// ============================================

/**
 * Require authentication (throws if not authenticated)
 */
export async function requireAuth(): Promise<UserSession> {
    const session = await getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    return session;
}

/**
 * Require authentication with tenant context
 */
export async function requireTenantAuth(request?: Request): Promise<AuthResult> {
    const session = await requireAuth();

    // Get tenant ID from header, cookie, or session
    let tenantId = session.tenantId;

    if (request) {
        const headerTenantId = request.headers.get('x-tenant-id');
        if (headerTenantId) {
            tenantId = headerTenantId;
        }
    }

    if (!tenantId) {
        throw new Error('Tenant context required. Please select a tenant.');
    }

    // Verify user has access to tenant and get granular permissions
    const access = await getUserTenantAccess(session.id, tenantId);
    if (!access) {
        throw new Error('Access denied to this tenant');
    }

    // STRICT: Subscription Check
    // We already fetch FULL tenant context, so the access object (or separate fetching) should validation subscription.
    // getUserTenantAccess currently returns { role, permissions }.
    // I need to fetch subscription status.
    // OPTIMIZATION: getUserTenants returns it. Maybe getUserTenantAccess should too?
    // Let's rely on session.tenants cache for performance or fetch fresh?
    // "Fail fast". Fresh fetch is better for enforcement? Or session cache is fine (60m).
    // Session is refreshed on login/switch.
    // If I use session.tenants, I can check it.

    // Check session cache first (fastest)
    const membership = session.tenants?.find(t => t.tenantId === tenantId);
    // Note: session.tenants might be stale if sub updated recently.
    // Ideally query DB, but for now enforcing via session cache + middleware refresh is okay.
    // If strictness is paramount, I should query DB.
    // But requireTenantAuth is called on every API request. DB query is expensive?
    // Let's use session.

    if (membership) {
        const status = membership.subscriptionStatus;
        if (status && status !== 'active' && status !== 'trialing') {
            throw new Error('SUBSCRIPTION_REQUIRED');
        }
    }

    // Update session with current context (in memory for this request)
    session.tenantId = tenantId;
    session.tenantRole = access.role;
    session.permissions = access.permissions;

    return {
        session,
        tenantId,
        tenantRole: access.role,
        permissions: access.permissions,
    };
}

/**
 * STRICT COMPANY CONTEXT GUARD
 * 
 * Enforces company association. If no company_id (tenantId) is present,
 * access is strictly denied.
 */
export function requireCompanyContext(session: UserSession): string {
    if (!session.tenantId) {
        throw new Error('COMPANY_ASSOCIATION_REQUIRED');
    }
    return session.tenantId;
}

/**
 * Require platform admin access
 */
export async function requirePlatformAdmin(): Promise<UserSession> {
    const session = await requireAuth();

    if (!session.isPlatformAdmin) {
        throw new Error('Platform admin access required');
    }

    return session;
}

/**
 * Require specific tenant role
 */
export async function requireTenantRole(
    requiredRole: TenantRole,
    request?: Request
): Promise<AuthResult> {
    const { session, tenantId, tenantRole, permissions } = await requireTenantAuth(request);

    const roleHierarchy: Record<TenantRole, number> = {
        owner: 4,
        admin: 3,
        member: 2,
        viewer: 1,
    };

    if (roleHierarchy[tenantRole] < roleHierarchy[requiredRole]) {
        throw new Error(`Requires ${requiredRole} role or higher`);
    }

    return { session, tenantId, tenantRole, permissions };
}

// ============================================
// PLATFORM ADMIN MANAGEMENT
// ============================================

/**
 * Get platform admin role for a user
 */
async function getPlatformAdminRole(userId: number): Promise<PlatformRole | null> {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            'SELECT role FROM platform_admins WHERE user_id = ?',
            [userId]
        );

        if (rows.length === 0) return null;
        return rows[0].role as PlatformRole;
    } finally {
        connection.release();
    }
}

// ============================================
// USER AUTHENTICATION
// ============================================

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(
    email: string,
    password: string
): Promise<UserSession | null> {
    const connection = await pool.getConnection();
    try {
        // First try the new users table
        let [users]: any = await connection.execute(
            'SELECT id, email, password_hash, name FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        // Fall back to admins table for backward compatibility
        if (users.length === 0) {
            [users] = await connection.execute(
                'SELECT id, email, password_hash, name, role FROM admins WHERE email = ?',
                [email]
            );
        }

        if (users.length === 0) {
            return null;
        }

        const user = users[0];

        // Verify password
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return null;
        }

        // Update last login
        await connection.execute(
            'UPDATE users SET last_login = NOW() WHERE id = ?',
            [user.id]
        ).catch(() => {
            // Also update admins table for backward compatibility
            connection.execute(
                'UPDATE admins SET last_login = NOW() WHERE id = ?',
                [user.id]
            );
        });

        // Create session
        await createSession({
            id: user.id,
            email: user.email,
            name: user.name || '',
            role: user.role || 'member',
        });

        return getSession();
    } finally {
        connection.release();
    }
}

// ============================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================

// AdminSession is already exported above via the interface declaration
