
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2, Sparkles, CreditCard, Shield, Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useScript } from '@/hooks/use-script';

export default function BillingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

    // Load Razorpay Script
    const scriptStatus = useScript('https://checkout.razorpay.com/v1/checkout.js');

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await fetch('/api/admin/billing/subscription');
            if (res.ok) {
                const data = await res.json();
                setCurrentPlan(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (planId: string) => {
        // 0. Check Script Status
        if (scriptStatus !== 'ready') {
            console.warn('Razorpay script not ready:', scriptStatus);
            toast({
                title: 'System Not Ready',
                description: 'Payment gateway is still connecting... Please try again in 5 seconds.',
                variant: 'destructive'
            });
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Order
            console.log(`Creating order for plan: ${planId} (${interval})`);
            const res = await fetch('/api/admin/billing/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, interval }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to initiate upgrade');

            console.log('Order created successfully:', data);

            // 2. Open Razorpay
            if (!(window as any).Razorpay) {
                throw new Error('Razorpay SDK failed to load globally.');
            }

            const options = {
                key: data.keyId, // Ensure this is valid
                amount: data.amount,
                currency: data.currency,
                name: "Fliphats CRM",
                description: `Upgrade to ${data.planName} (${interval})`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    console.log('Razorpay Payment Success:', response);

                    // 3. Verify Payment
                    try {
                        const verifyRes = await fetch('/api/admin/billing/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...response,
                                planId,
                                interval
                            }),
                        });

                        if (verifyRes.ok) {
                            toast({
                                title: "Upgrade Successful!",
                                description: `Welcome to the ${data.planName} plan.`,
                                duration: 5000,
                            });
                            setTimeout(() => window.location.reload(), 1500);
                        } else {
                            throw new Error('Payment verification server check failed');
                        }
                    } catch (e) {
                        console.error('Verify error:', e);
                        toast({ title: 'Payment Verified Locally', description: 'But server update failed. Please contact support.', variant: 'destructive' });
                    }
                },
                theme: {
                    color: "#0f172a"
                },
                modal: {
                    ondismiss: function () {
                        console.log('Payment modal dismissed by user');
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);

            rzp.on('payment.failed', function (response: any) {
                console.error('Payment failed event:', response.error);
                toast({
                    title: 'Payment Failed',
                    description: response.error.description || 'Transaction was declined.',
                    variant: 'destructive'
                });
                setSubmitting(false);
            });

            rzp.open();

        } catch (error: any) {
            console.error('Handle Upgrade Exception:', error);
            toast({
                title: 'Upgrade Error',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
            setSubmitting(false);
        }
    };

    // UI Configuration for Plans
    const PLANS_UI = [
        {
            id: 'free',
            name: 'Free',
            price: { monthly: 0, yearly: 0 },
            description: "Essential tools for solopreneurs.",
            features: [
                "1 User", "100 Leads", "500 Emails/mo", "Community Support"
            ]
        },
        {
            id: 'starter',
            name: 'Starter',
            price: { monthly: 299, yearly: 2990 },
            description: "Go beyond basics with automation.",
            features: [
                "5 Users", "5,000 Leads", "10,000 Emails/mo", "Email Support", "Basic CRM"
            ]
        },
        {
            id: 'professional',
            name: 'Professional',
            popular: true,
            price: { monthly: 799, yearly: 7990 },
            description: "Scale your sales with power tools.",
            features: [
                "20 Users", "50,000 Leads", "100k Emails/mo", "Priority Support", "Advanced CRM", "Custom Domain"
            ]
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: { monthly: 1999, yearly: 19990 },
            description: "Unlimited power for large teams.",
            features: [
                "Unlimited Users", "1M Leads", "1M Emails/mo", "24/7 Phone Support", "Dedicated Manager", "SLA"
            ]
        }
    ];

    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center gap-2">
            <Loader2 className="animate-spin" /> Loading billing info...
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Plans</h1>
                    <p className="text-muted-foreground mt-1">Manage your subscription and usage limits.</p>
                </div>
            </div>

            {/* Current Subscription Card */}
            <Card className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-zinc-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

                <CardHeader className="relative z-10 pb-2">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardDescription className="text-zinc-400">Current Plan</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-3">
                                {currentPlan?.features?.name || 'Free Plan'}
                                <Badge variant="secondary" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                    {currentPlan?.status?.toUpperCase()}
                                </Badge>
                            </CardTitle>
                        </div>
                        <div className="hidden md:block">
                            {/* Usage Rings or Stats could go here */}
                            <div className="text-right">
                                <p className="text-sm text-zinc-400">Next Renewal</p>
                                <p className="font-medium">
                                    {currentPlan?.subscription?.endDate
                                        ? new Date(currentPlan.subscription.endDate).toLocaleDateString()
                                        : 'Never (Free Forever)'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 grid md:grid-cols-4 gap-6 pt-6">
                    {/* Limits Display */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Users</p>
                        <p className="text-2xl font-bold">{currentPlan?.features?.limits?.users ?? 1}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Leads</p>
                        <p className="text-2xl font-bold">{currentPlan?.features?.limits?.leads?.toLocaleString() ?? 100}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Emails/mo</p>
                        <p className="text-2xl font-bold">{currentPlan?.features?.limits?.emailsPerMonth?.toLocaleString() ?? 500}</p>
                    </div>

                </CardContent>
            </Card>

            {/* Upgrade Section */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <h2 className="text-xl font-semibold">Available Plans</h2>
                    <Tabs value={interval} onValueChange={(v) => setInterval(v as any)} className="w-full md:w-auto">
                        <TabsList className="grid w-full md:w-[200px] grid-cols-2">
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly (-20%)</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {PLANS_UI.map((plan) => {
                        const isCurrent = currentPlan?.plan === plan.id;
                        const price = interval === 'yearly' ? plan.price.yearly : plan.price.monthly;

                        return (
                            <Card
                                key={plan.id}
                                className={`flex flex-col relative transition-all duration-200 
                                    ${plan.popular ? 'border-primary shadow-lg scale-105 z-10' : 'hover:border-zinc-300 dark:hover:border-zinc-700'}
                                    ${isCurrent ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800' : ''}
                                `}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                        MOST POPULAR
                                    </div>
                                )}

                                <CardHeader>
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">₹{price}</span>
                                        <span className="text-muted-foreground text-sm">/{interval === 'yearly' ? 'yr' : 'mo'}</span>
                                    </div>

                                    <ul className="space-y-3 text-sm">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                <Check className="w-4 h-4 text-primary shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={isCurrent ? "outline" : (plan.popular ? "default" : "secondary")}
                                        disabled={isCurrent || submitting}
                                        onClick={() => handleUpgrade(plan.id)}
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                            isCurrent ? "Current Plan" :
                                                "Upgrade"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Trust Badges / Footer */}
            <div className="flex justify-center gap-8 pt-10 text-zinc-400 grayscale opacity-70">
                <div className="flex items-center gap-2"><Shield className="w-5 h-5" /> Secure Payment</div>
                <div className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> All Cards Accepted</div>
                <div className="flex items-center gap-2"><Zap className="w-5 h-5" /> Instant Activation</div>
            </div>
        </div>
    );
}
