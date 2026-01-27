
import { describe, it, expect, vi } from 'vitest';
import { requireCompanyContext, UserSession } from '../lib/auth';

describe('Company Association System', () => {

    // 1️⃣ User exists, NO company association (BOOTSTRAP STATE)
    it('should throw COMPANY_ASSOCIATION_REQUIRED if tenantId is missing', () => {
        const session: UserSession = {
            id: 123,
            email: 'user@example.com',
            name: 'Test User',
            role: 'member',
            tenantId: null, // ❌ No Company
            tenantRole: null,
            tenants: [],
            isPlatformAdmin: false,
            platformRole: null
        };

        expect(() => requireCompanyContext(session)).toThrow('COMPANY_ASSOCIATION_REQUIRED');
    });

    // 2️⃣ User exists, company association CREATED
    it('should return tenantId if company association exists', () => {
        const session: UserSession = {
            id: 123,
            email: 'user@example.com',
            name: 'Test User',
            role: 'member',
            tenantId: 'comp_12345', // ✅ Company Exists
            tenantRole: 'owner',
            tenants: [{
                tenantId: 'comp_12345',
                role: 'owner',
                tenantName: 'Acme',
                tenantSlug: 'acme',
                tenantPlan: 'free',
                permissions: {},
                joinedAt: new Date(),
                subscriptionStatus: 'active'
            }],
            isPlatformAdmin: false,
            platformRole: null
        };

        const result = requireCompanyContext(session);
        expect(result).toBe('comp_12345');
    });

    // 3️⃣ User exists, company association REMOVED (Simulated)
    it('should block access even if user has other valid fields but no current tenant context', () => {
        const session: UserSession = {
            id: 123,
            email: 'user@example.com',
            name: 'Test User',
            role: 'member',
            tenantId: null, // ❌ Context Removed/Flushed
            tenantRole: null,
            tenants: [{
                tenantId: 'comp_12345',
                role: 'owner',
                tenantName: 'Acme',
                tenantSlug: 'acme',
                tenantPlan: 'free',
                permissions: {},
                joinedAt: new Date(),
                subscriptionStatus: 'active'
            }], // Has membership but not active
            isPlatformAdmin: false,
            platformRole: null
        };

        // Even if they "belong" to a tenant, if the *current context* is null, they must select it first (Bootstrap State)
        expect(() => requireCompanyContext(session)).toThrow('COMPANY_ASSOCIATION_REQUIRED');
    });
});
