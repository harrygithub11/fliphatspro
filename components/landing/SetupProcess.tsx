'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Code2, Rocket, Zap } from 'lucide-react';
import React from 'react';

const defaultSteps = [
    {
        step: "01",
        title: "Share Requirements",
        desc: "Fill a structured form with your product details, colors, and vision. Takes 5 mins.",
        icon: "ClipboardList",
    },
    {
        step: "02",
        title: "We Develop",
        desc: "Our pro team builds your store, sets up payments, and configures shipping.",
        icon: "Code2",
    },
    {
        step: "03",
        title: "Launch & Train",
        desc: "Handover in 24 hours. We give you a 1:1 training session to manage your empire.",
        icon: "Rocket",
    },
];

interface SetupProcessProps {
    badge?: string;
    title?: React.ReactNode;
    subtitle?: string;
    items?: any[];
}

export function SetupProcess({
    badge = "Fast Track",
    title = <>From Idea to Brand in <span className="text-red-600 underline decoration-4 decoration-red-200 dark:decoration-red-900/50 underline-offset-4">24 Hours</span></>,
    subtitle = "We've optimized the launch process. No drag-and-drop headaches. Just results.",
    items = []
}: SetupProcessProps) {
    const steps = items.length > 0 ? items : defaultSteps;
    const IconMap: any = { ClipboardList, Code2, Rocket, Zap };

    return (
        <section className="container mx-auto px-4 py-32 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-20 relative z-10"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
                    <Zap className="w-3 h-3 fill-current" /> {badge}
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">
                    {title}
                </h2>
                <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-light">
                    {subtitle}
                </p>
            </motion.div>

            <div className="relative max-w-6xl mx-auto z-10">
                <div className="hidden md:absolute top-12 left-[10%] right-[10%] h-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10 overflow-hidden rounded-full">
                    <motion.div
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-red-500"
                    />
                </div>

                <div className="grid md:grid-cols-3 gap-8 md:gap-12">
                    {steps.map((s, i) => {
                        const Icon = typeof s.icon === 'string' ? (IconMap[s.icon] || Zap) : s.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.2 }}
                                whileHover={{ y: -5 }}
                                className="relative group"
                            >
                                <div className="bg-zinc-950/50 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-xl hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden">
                                    <span className="absolute -top-6 -right-6 text-9xl font-black text-zinc-900 select-none -z-10 group-hover:scale-110 transition-transform duration-500">
                                        {s.step}
                                    </span>
                                    <div className={`w-24 h-24 rounded-full bg-red-900/10 border border-red-900/30 shadow-inner flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-300`}>
                                        <Icon className="w-10 h-10 text-red-600 dark:text-red-500" />
                                        <div className="absolute -bottom-2 bg-zinc-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-zinc-700 uppercase tracking-widest text-zinc-500">
                                            Step {s.step}
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">{s.title}</h3>
                                    <p className="text-zinc-400 leading-relaxed">
                                        {s.desc}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
