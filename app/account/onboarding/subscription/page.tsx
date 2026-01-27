'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const plans = [
        {
            id: 'free',
            name: 'Free Trial',
            price: '₹0',
            duration: '7 Days',
            features: ['Single User', 'Basic Leads', 'Email Support'],
            cta: 'Start Free Trial',
            color: 'bg-green-100 text-green-700 hover:bg-green-200'
        },
        {
            id: 'starter',
            name: 'Starter',
            price: '₹299',
            duration: 'per month',
            features: ['Up to 3 Users', 'Advanced CRM', '5GB Storage', 'Priority Support'],
            cta: 'Subscribe Now',
            color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
        },
        {
            id: 'professional',
            name: 'Professional',
            price: '₹999',
            duration: 'per month',
            features: ['Unlimited Users', 'Full Automation', '50GB Storage', 'Dedicated Manager'],
            cta: 'Go Pro',
            color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
        }
    ];

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId);
        try {
            const res = await fetch('/api/admin/subscription/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planId }),
            });

            if (res.ok) {
                router.push('/admin/dashboard');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to subscribe');
            }
        } catch (error) {
            console.error(error);
            alert('Error processing subscription');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center justify-center">
            <div className="text-center mb-10 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-2">
                    <ShieldCheck className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Choose Your Plan</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Select a plan to unlock your workspace. You can upgrade or cancel at any time.
                    <br />
                    <span className="font-semibold text-primary">No credit card required for trial.</span>
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`relative flex flex-col border-2 ${plan.id === 'professional' ? 'border-purple-500 shadow-xl scale-105' : 'border-transparent shadow-md'}`}>
                        {plan.id === 'professional' && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                                <Zap className="h-3 w-3 fill-current" /> Most Popular
                            </div>
                        )}
                        <CardHeader className="text-center pb-2">
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            <div className="mt-4 mb-2">
                                <span className="text-4xl font-extrabold">{plan.price}</span>
                                <span className="text-muted-foreground text-sm font-medium"> / {plan.duration}</span>
                            </div>
                            <CardDescription>{plan.features.length} features included</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ul className="space-y-3 mt-4 text-sm">
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                        <span className="text-gray-700">{feat}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={`w-full py-6 text-lg font-bold transition-all ${plan.color}`}
                                variant="outline"
                                onClick={() => handleSelectPlan(plan.id)}
                                disabled={loading !== null}
                            >
                                {loading === plan.id ? 'Processing...' : plan.cta}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
