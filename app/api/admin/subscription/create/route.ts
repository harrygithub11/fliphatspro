
import { NextResponse } from 'next/server';
import { requireAuth, requireCompanyContext } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const result = await requireAuth();
        const tenantId = requireCompanyContext(result); // Enforce Company Context

        const { plan } = await request.json();

        if (!plan) {
            return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
        }

        // Logic for trial dates
        const now = new Date();
        const trialEnd = new Date();
        trialEnd.setDate(now.getDate() + 7); // 7 Days Trial

        await prisma.subscription.upsert({
            where: { tenantId: tenantId },
            update: {
                plan: plan === 'free' ? 'free' : (plan === 'starter' ? 'starter' : (plan === 'professional' ? 'professional' : 'enterprise')),
                status: 'active',
                trialStart: now,
                trialEnd: trialEnd,
                startDate: now
            },
            create: {
                tenantId: tenantId,
                plan: plan === 'free' ? 'free' : (plan === 'starter' ? 'starter' : (plan === 'professional' ? 'professional' : 'enterprise')),
                status: 'active',
                trialStart: now,
                trialEnd: trialEnd,
                startDate: now
            }
        });

        // Also update the tenant plan field in Tenant table (denormalization for easy access)
        await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: plan === 'free' ? 'free' : (plan === 'starter' ? 'starter' : (plan === 'professional' ? 'professional' : 'enterprise')) }
        });

        // 3. Refresh Session (CRITICAL: Update JWT with new subscription status)
        // We need to re-fetch the user and their tenants to get the latest status
        const { createSession } = await import('@/lib/auth');
        const { getUserTenants } = await import('@/lib/tenant-context');

        // Fetch FRESH tenants list (including the new subscription)
        const updatedTenants = await getUserTenants(result.id);

        // Re-create session
        await createSession({
            id: result.id,
            email: result.email,
            name: result.name,
            role: result.role,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Subscription Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
