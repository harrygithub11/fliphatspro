
import { NextResponse } from 'next/server';
import { requireTenantRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PLANS, PRICING_CURRENCY } from '@/lib/plans-config';
import Razorpay from 'razorpay';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { tenantId } = await requireTenantRole('viewer', request);

        // Fetch Subscription details
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId },
            include: { tenant: { select: { plan: true } } }
        });

        // Determine current plan from subscription OR tenant fallback
        const currentPlanId = subscription?.plan || 'free';
        const currentPlanDetails = PLANS[currentPlanId] || PLANS['free'];

        return NextResponse.json({
            plan: subscription?.plan || 'free',
            status: subscription?.status || 'active',
            subscription: subscription,
            features: currentPlanDetails
        });

    } catch (error: any) {
        if (error.message.includes('Unauthorized')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { tenantId } = await requireTenantRole('admin', request); // Only admins can upgrade
        const body = await request.json();
        const { planId, interval } = body; // interval: 'monthly' | 'yearly'

        if (!planId || !PLANS[planId as keyof typeof PLANS]) {
            return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        const targetPlan = PLANS[planId as keyof typeof PLANS];
        const price = interval === 'yearly' ? targetPlan.price.yearly : targetPlan.price.monthly;

        // Fetch Razorpay Keys from Tenant Settings
        // In a real multi-tenant app, the PLATFORM uses its own keys to charge the tenant.
        // Or if this is a white-label solution, maybe tenant keys? 
        // USUAL FLOW: SaaS Owner charges the Tenant. So we use ENV variables or Admin System Settings.
        // Checking `site_settings` implies the TENANT'S settings.
        // Wait, if I am the SaaS Admin, I charge my users using MY Razorpay.
        // If this is a Tenant charging THEIR customers, they use Tenant Settings.
        // CONTEXT: This is "Workspace Settings" -> "Billing". This implies the Tenant paying the SaaS Platform.
        // So we should use process.env.RAZORPAY_KEY_ID (Platform Keys).

        // HOWEVER, the user previously implemented "Dynamic Settings" for Razorpay Keys in `lib/settings-config.ts`.
        // That was for "Integrations" -> likely for the Tenant to charge THEIR customers.
        // I need to use the PLATFORM'S keys here. I will assume they are in ENV or I will default to test keys if missing.

        const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_default';
        const key_secret = process.env.RAZORPAY_KEY_SECRET || 'secret_default';

        if (!key_id || !key_secret) {
            // Fallback for demo/dev if env missing
            console.warn("Razorpay keys missing in ENV, using mocks or failing.");
        }

        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: key_secret,
        });

        // Create Order
        const amountInPaisa = price * 100; // Plan price is in base units (INR 299), Razorpay needs paisa
        const currency = PRICING_CURRENCY.code;

        const options = {
            amount: amountInPaisa,
            currency,
            receipt: `sub_${tenantId.slice(0, 8)}_${Date.now()}`,
            notes: {
                tenantId: tenantId,
                planId: planId,
                interval: interval
            }
        };

        try {
            const order = await razorpay.orders.create(options);
            return NextResponse.json({
                orderId: order.id,
                amount: amountInPaisa,
                currency: currency,
                keyId: key_id,
                planName: targetPlan.name
            });
        } catch (rzpError: any) {
            console.error('Razorpay Order Creation Failed:', rzpError);
            return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Upgrade Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
