
import { TenantPlan } from "@prisma/client";

export interface PlanFeature {
    name: string;
    included: boolean;
    limit?: string | number;
    tooltip?: string;
}

export interface Plan {
    id: TenantPlan;
    name: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: PlanFeature[];
    limits: {
        users: number;
        leads: number;
        emailsPerMonth: number;
    };
    popular?: boolean;
    stripePriceId?: {
        monthly: string;
        yearly: string;
    };
}

export const PLANS: Record<TenantPlan, Plan> = {
    free: {
        id: "free",
        name: "Free",
        description: "Perfect for solopreneurs just starting out.",
        price: { monthly: 0, yearly: 0 },
        limits: {
            users: 1,
            leads: 100,
            emailsPerMonth: 500
        },
        features: [
            { name: "Single User", included: true },
            { name: "Basic CRM", included: true },
            { name: "500 Emails/mo", included: true },
            { name: "Email Support", included: false },
            { name: "Custom Domain", included: false }
        ]
    },
    starter: {
        id: "starter",
        name: "Starter",
        description: "For small teams growing their business.",
        price: { monthly: 299, yearly: 2990 },
        // Limits...
        limits: {
            users: 5,
            leads: 5000,
            emailsPerMonth: 10000
        },
        features: [
            { name: "Up to 5 Users", included: true },
            { name: "Advanced CRM", included: true },
            { name: "10,000 Emails/mo", included: true },
            { name: "Email Support", included: true },
            { name: "Custom Domain", included: false }
        ]
    },
    professional: {
        id: "professional",
        name: "Professional",
        description: "For scaling agencies and power users.",
        price: { monthly: 799, yearly: 7990 },
        popular: true,
        limits: {
            users: 20,
            leads: 50000,
            emailsPerMonth: 100000
        },
        features: [
            { name: "Up to 20 Users", included: true },
            { name: "Full CRM Suite", included: true },
            { name: "100k Emails/mo", included: true },
            { name: "Priority Support", included: true },
            { name: "Custom Domain", included: true }
        ]
    },
    enterprise: {
        id: "enterprise",
        name: "Enterprise",
        description: "Custom solutions for large organizations.",
        price: { monthly: 1999, yearly: 19990 },
        limits: {
            users: 100,
            leads: 1000000,
            emailsPerMonth: 1000000
        },
        features: [
            { name: "Unlimited Users", included: true },
            { name: "Enterprise Features", included: true },
            { name: "1M Emails/mo", included: true },
            { name: "24/7 Phone Support", included: true },
            { name: "Custom Domain", included: true }
        ]
    }
};

export const PRICING_CURRENCY = {
    code: 'INR',
    symbol: '₹'
};
