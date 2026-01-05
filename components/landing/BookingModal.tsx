'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { HoverButton } from '@/components/ui/hover-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

declare global {
    interface Window {
        Razorpay: any;
    }
}

type ModalType = 'book' | 'pay' | 'link';

interface BookingModalProps {
    children?: React.ReactNode;
    type?: ModalType;
    triggerText?: string;
    amount?: number;
    source?: string;
    paymentLink?: string;
}

export function BookingModal({
    children,
    type = 'book',
    triggerText,
    amount = 5000,
    source = 'website',
    paymentLink
}: BookingModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [store, setStore] = useState('');

    const loadRazorpay = () => {
        // ... (existing implementation)
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        // ... (existing implementation)
        const res = await loadRazorpay();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            const orderRes = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, name, email, phone, store_name: store, source }),
            });
            // ... (rest of payment logic)
            if (!orderRes.ok) {
                alert("Error creating order");
                return;
            }

            const orderData = await orderRes.json();

            // 2. Open Razorpay Options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "FliphatMedia",
                description: type === 'pay' ? `Order from ${source}` : "New Year Offer - E-commerce Store",
                image: "/Photos/logo.png",
                order_id: orderData.id,
                handler: async function (response: any) {
                    await fetch('/api/payment-success', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });
                    setOpen(false);
                    router.push(`/onboarding?payment_id=${response.razorpay_payment_id}&email=${encodeURIComponent(email)}`);
                },
                prefill: { name, email, contact: phone },
                theme: { color: "#DC2626" }
            };
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (type === 'pay' && !paymentLink) {
            await handlePayment();
        } else {
            // Regular Booking / Lead Form
            try {
                const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, phone, store, type: 'book', source }),
                });

                if (res.ok) {
                    // Tracking handled by API
                    setName(''); setEmail(''); setPhone(''); setStore('');
                    setOpen(false);
                    alert("Thanks! We've received your inquiry. We'll call you shortly.");
                } else {
                    alert("Something went wrong. Please try again.");
                }
            } catch (error) {
                console.error(error);
                alert("Error submitting form.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDirectLink = async () => {
        if (paymentLink) {
            // Track Click
            try {
                navigator.sendBeacon('/api/track-click', JSON.stringify({ source, url: paymentLink }));
            } catch (e) {
                // Ignore tracking error
            }

            const isAbsolute = paymentLink.startsWith('http://') || paymentLink.startsWith('https://');
            const finalUrl = isAbsolute ? paymentLink : `https://${paymentLink}`;
            window.location.href = finalUrl;
        }
    };

    // If type is link OR (pay + link), render direct button
    if ((type === 'link' || (type === 'pay' && paymentLink))) {
        return (
            <div onClick={handleDirectLink} className="cursor-pointer">
                {children || (
                    <HoverButton
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                        {triggerText || 'Get Instant Access'}
                    </HoverButton>
                )}
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <HoverButton
                        className={type === 'pay'
                            ? "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                            : "w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-lg h-14 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 backdrop-blur-none border-transparent"}
                    >
                        {triggerText || (type === 'pay' ? 'Get Instant Access' : 'Book a Free Strategy Call')}
                    </HoverButton>
                )}
            </DialogTrigger>
            <DialogContent className="w-[90vw] sm:w-full sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white shadow-2xl overflow-hidden selection:bg-red-500/30 rounded-2xl md:rounded-xl">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-red-900/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <DialogHeader className="space-y-2 items-center text-center">
                    <DialogTitle className="text-xl md:text-2xl font-black tracking-tight flex items-center justify-center gap-2">
                        {type === 'pay' ? 'Complete Purchase' : 'Book a Strategy Call'}
                        <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                    </DialogTitle>
                    <p className="text-sm text-zinc-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                        {type === 'pay' ? 'Secure your exclusive offer now.' : 'Zero commitment. 100% value.'}
                    </p>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 md:gap-5 py-4 relative z-10">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-400 font-bold text-[10px] md:text-xs uppercase tracking-wider">Name</Label>
                        <Input
                            id="name"
                            placeholder="John Doe"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600 h-11 text-base md:text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600 h-11"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone" className="text-zinc-400 font-bold text-xs uppercase tracking-wider">WhatsApp Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="+91 9876543210"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600 h-11"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="store" className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Existing Store (Optional)</Label>
                        <Input
                            id="store"
                            placeholder="www.examplestore.com"
                            value={store}
                            onChange={(e) => setStore(e.target.value)}
                            className="bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-red-600 focus-visible:border-red-600 h-11"
                        />
                    </div>
                    {type === 'pay' && (
                        <div className="p-4 bg-red-900/10 rounded-xl text-sm border border-red-900/20">
                            <div className="flex justify-between font-bold text-white mb-1 text-base">
                                <span>Offer Price</span>
                                <span>₹{amount.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-red-400">Secure payment via UPI/Card/NetBanking</p>
                        </div>
                    )}
                    <Button
                        type="submit"
                        className="w-full mt-2 h-12 text-base font-bold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02] rounded-xl"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (type === 'pay' ? 'Proceed to Payment' : 'Schedule Free Strategy Call')}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
