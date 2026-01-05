"use client";

import { motion } from "framer-motion";
import { Check, X, Info, ArrowRight } from "lucide-react";
import { BookingModal } from "./BookingModal";

export function ComparisonTable() {
    const features = [
        {
            name: "Setup Cost",
            fliphat: "One-time Payment",
            shopify: "Monthly Subscription",
            description: "Pay once and own your store forever vs renting it every month."
        },
        {
            name: "Monthly Fees",
            fliphat: "₹ 0 / month",
            shopify: "₹ 1,994 / month +",
            description: "Save ~₹24,000 every year in platform fees alone."
        },
        {
            name: "Transaction Fees",
            fliphat: "0% Commission",
            shopify: "2.0% per sale",
            description: "Keep 100% of your hard-earned revenue."
        },
        {
            name: "Code Ownership",
            fliphat: "100% Yours",
            shopify: "Zero (Locked)",
            description: "You own the source code. Host it anywhere you want."
        },
        {
            name: "Customization",
            fliphat: "Unlimited",
            shopify: "Restricted",
            description: "No limits on design or functionality."
        }
    ];

    return (
        <section className="py-12 md:py-24 relative overflow-hidden bg-transparent border-y border-white/5">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-600/10 rounded-full blur-[80px] md:blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10" />
            <div className="absolute bottom-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-900/10 rounded-full blur-[80px] md:blur-[120px] translate-y-1/2 -translate-x-1/2 -z-10" />

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                <div className="text-center mb-8 md:mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 md:px-6 md:py-2 rounded-full border border-red-900/50 bg-red-900/10 text-red-500 font-bold text-xs md:text-sm mb-4 md:mb-6 shadow-sm"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Don't Get Trapped by Subscriptions
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-6xl font-black mb-4 md:mb-6 tracking-tight leading-tight text-white"
                    >
                        Compare & <span className="text-red-600">Save</span>
                    </motion.h2>
                    <p className="text-sm md:text-lg text-zinc-400 max-w-xl mx-auto hidden md:block">
                        See exactly how much you save by switching to the founder-friendly model.
                    </p>
                </div>

                {/* Desktop View (Cards) - Hidden on Mobile */}
                {/* Desktop View (Cards) - Hidden on Mobile */}
                <div className="hidden md:grid md:grid-cols-12 gap-0 items-stretch bg-zinc-900/50 backdrop-blur-sm rounded-3xl shadow-xl border border-zinc-800 overflow-hidden ring-1 ring-zinc-800">
                    {/* Feature Names Column (Span 4) */}
                    <div className="col-span-4 flex flex-col bg-zinc-950/30 border-r border-zinc-800">
                        <div className="min-h-[140px] p-8 flex items-end pb-6 border-b border-zinc-800">
                            <span className="font-bold text-2xl text-zinc-500">Features</span>
                        </div>
                        {features.map((feature, i) => (
                            <div key={i} className="min-h-[100px] px-8 py-6 flex items-center border-b border-zinc-800 last:border-0">
                                <div className="flex flex-col gap-1">
                                    <span className="font-bold text-lg text-zinc-200">{feature.name}</span>
                                    <span className="text-xs text-zinc-500 leading-relaxed max-w-[220px]">{feature.description}</span>
                                </div>
                            </div>
                        ))}
                        {/* Spacer for bottom */}
                        <div className="min-h-[140px] bg-zinc-950/30"></div>
                    </div>

                    {/* Shopify Column (Span 4) */}
                    <div className="col-span-4 flex flex-col border-r border-zinc-800 bg-zinc-900/80 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-dots-pattern opacity-5 pointer-events-none" />
                        <div className="min-h-[140px] p-8 flex flex-col justify-end items-center border-b border-zinc-800 bg-zinc-950/50 pb-6">
                            <h3 className="text-2xl font-bold text-zinc-500 mb-2">Shopify</h3>
                            <div className="px-3 py-1 rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                Subscription
                            </div>
                        </div>
                        {features.map((feature, i) => (
                            <div key={i} className="min-h-[100px] px-6 flex flex-col items-center justify-center border-b border-zinc-800 last:border-0 relative">
                                <div className="flex items-center gap-3 text-lg font-medium text-zinc-500">
                                    <X className="h-5 w-5 text-red-900" />
                                    <span className="decoration-2 decoration-red-900/50 line-through">{feature.shopify}</span>
                                </div>
                            </div>
                        ))}
                        <div className="min-h-[140px] p-8 flex items-center justify-center grayscale opacity-40">
                            <span className="text-2xl font-bold text-zinc-600 line-through decoration-2 decoration-red-900">Costly</span>
                        </div>
                    </div>

                    {/* FliphatMedia Column (Span 4) */}
                    <div className="col-span-4 flex flex-col relative bg-gradient-to-b from-red-950/20 to-transparent z-10">
                        <div className="absolute top-0 inset-x-0 h-1 bg-red-600" />
                        <div className="min-h-[140px] p-8 flex flex-col justify-end items-center text-center border-b border-red-900/30 pb-6">
                            <h3 className="text-3xl font-black text-red-500 mb-2 tracking-tight">FliphatMedia</h3>
                            <div className="px-4 py-1.5 rounded-full bg-red-900/20 text-[11px] font-bold text-red-400 uppercase tracking-wider border border-red-900/40 flex items-center gap-2 shadow-sm">
                                <span className="nav-indicator bg-red-600 animate-pulse"></span>
                                One-Time Payment
                            </div>
                        </div>

                        {features.map((feature, i) => (
                            <div key={i} className="min-h-[100px] px-6 flex flex-col items-center justify-center border-b border-red-900/30 last:border-0 relative bg-red-900/5 backdrop-blur-sm">
                                <div className="flex items-center gap-3 text-xl font-bold text-white">
                                    <div className="h-7 w-7 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-500/20 shrink-0">
                                        <Check className="h-4 w-4 stroke-[3]" />
                                    </div>
                                    {feature.fliphat}
                                </div>
                            </div>
                        ))}
                        <div className="min-h-[140px] p-8 flex items-center justify-center">
                            <BookingModal type="book" source="comparison_table_desktop">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-lg shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)] transition-all flex items-center justify-center gap-2 group"
                                >
                                    Get Started Now
                                </motion.button>
                            </BookingModal>
                        </div>
                    </div>
                </div>

                {/* Mobile View (Compact Grid) - Visible Only on Mobile */}
                <div className="md:hidden bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 bg-zinc-950 border-b border-zinc-800 text-xs font-bold py-3 px-2">
                        <div className="col-span-4 text-zinc-400 pl-2 leading-tight flex items-center">Feature</div>
                        <div className="col-span-4 text-center text-zinc-500 leading-tight flex items-center justify-center">Shopify</div>
                        <div className="col-span-4 text-center text-red-500 leading-tight flex items-center justify-center">FliphatMedia</div>
                    </div>

                    {/* Rows */}
                    {features.map((feature, i) => (
                        <div key={i} className="grid grid-cols-12 border-b last:border-0 border-zinc-800 items-center py-4 px-2">
                            {/* Feature Name */}
                            <div className="col-span-4 pl-2 pr-1">
                                <div className="font-bold text-xs text-white leading-tight">{feature.name}</div>
                            </div>

                            {/* Shopify Value */}
                            <div className="col-span-4 text-center px-1 border-r border-dashed border-zinc-800">
                                <div className="text-[10px] text-zinc-500 line-through decoration-red-900/50 leading-tight">
                                    {feature.shopify.replace('Subscription', 'Sub')}
                                </div>
                            </div>

                            {/* Fliphat Value */}
                            <div className="col-span-4 text-center px-1 -my-4 py-4 flex items-center justify-center">
                                <div className="text-[10px] font-bold text-white bg-red-900/20 border border-red-900/40 px-2 py-1 rounded-full whitespace-nowrap shadow-sm">
                                    {feature.fliphat.replace('Payment', 'Pay')}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Mobile CTA */}
                    <div className="p-4 bg-red-900/5 border-t border-red-900/20">
                        <BookingModal type="book" source="comparison_table_mobile">
                            <button className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2">
                                Start Your Store <ArrowRight className="h-4 w-4" />
                            </button>
                        </BookingModal>
                    </div>
                </div>

            </div>
        </section>
    );
}
