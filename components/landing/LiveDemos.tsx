"use client";

import { motion } from "framer-motion";
import { ExternalLink, LayoutDashboard, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveDemos() {
    return (
        <section className="py-24 relative overflow-hidden bg-transparent">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />

            <div className="container mx-auto px-4 z-10 relative">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-red-500 text-sm font-semibold mb-6"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                        Live Interactive Demos
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white"
                    >
                        Experience the Power
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-zinc-400"
                    >
                        Don't just take our word for it. Explore the live store and the powerful admin panel behind it.
                    </motion.p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    <DemoCard
                        title="Live Demo Store"
                        subtitle="Customer Experience"
                        desc="See how your customers will browse and buy from your brand."
                        video="/Videos/webpreview.mp4"
                        link="https://demo.fliphatmedia.com/"
                        action="Visit Store"
                        icon={ShoppingBag}
                        delay={0.3}
                        color="from-red-600/20 to-orange-600/20"
                    />

                    <DemoCard
                        title="Admin Dashboard"
                        subtitle="Business Control"
                        desc="Control everything from products and orders to payments."
                        video="/Videos/dashpreview.mp4"
                        link="https://demo.fliphatmedia.com/admin"
                        action="Try Admin Panel"
                        icon={LayoutDashboard}
                        delay={0.4}
                        color="from-red-600/20 to-orange-600/20"
                    />
                </div>
            </div>
        </section>
    );
}

function DemoCard({ title, subtitle, desc, video, link, action, icon: Icon, delay, color }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.7 }}
            className="group relative rounded-[2.5rem] overflow-hidden border border-zinc-800 bg-zinc-950/50 backdrop-blur-sm shadow-2xl hover:shadow-red-900/10 transition-all duration-500"
        >
            {/* Header */}
            <div className="relative z-20 p-8 md:p-10 flex flex-col h-full pointer-events-none">
                <div className="flex items-start justify-between mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white group-hover:bg-red-600 group-hover:scale-110 transition-all duration-500">
                        <Icon className="h-7 w-7" />
                    </div>
                    <div className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-zinc-400 group-hover:border-red-600/30 group-hover:text-red-400 transition-colors duration-300">
                        {subtitle}
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <h3 className="text-3xl font-bold text-white">{title}</h3>
                    <p className="text-zinc-400 leading-relaxed max-w-sm">
                        {desc}
                    </p>
                </div>

                <div className="mt-auto pointer-events-auto">
                    <Button
                        onClick={() => window.open(link, '_blank')}
                        className="group/btn h-12 px-8 rounded-full text-base font-medium bg-white text-black hover:bg-zinc-200 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {action} <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>

            {/* Video Background with overlay */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-10" />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-transparent to-transparent z-10" />

                {/* Hover Reveal Effect */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br ${color} transition-opacity duration-700 z-10 mix-blend-overlay`} />

                <video
                    className="w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
                    autoPlay
                    loop
                    muted
                    playsInline
                >
                    <source src={video} type="video/mp4" />
                </video>
            </div>
        </motion.div>
    );
}
