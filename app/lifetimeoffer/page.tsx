'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Rocket, Code2, ClipboardList } from 'lucide-react';
import { VideoDialog } from '@/components/landing/VideoDialog';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/landing/BookingModal';
import { Pricing } from '@/components/landing/Pricing'; // Updated to accept props
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { CountdownTimer } from '@/components/landing/CountdownTimer';
import { OrderFlow } from '@/components/landing/OrderFlow';
import { Testimonials } from '@/components/landing/Testimonials';
import { motion } from 'framer-motion';
import { FeaturesBrowser } from '@/components/landing/FeaturesBrowser';
import { LiveDemos } from '@/components/landing/LiveDemos';
import { ComparisonTable } from '@/components/landing/ComparisonTable';
import { NewYearHero } from '@/components/landing/NewYearHero';
import { StickyCTA } from '@/components/landing/StickyCTA';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { GlobalBackground } from '@/components/ui/GlobalBackground';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
    }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

import { ThemeOverride } from '@/components/ui/ThemeOverride';

export default function LifetimeOfferPage() {
    // Configuration for this variant
    const PRICE = 12000;
    const ORIGINAL_PRICE = 36000;
    const SOURCE = 'lifetime_12k';
    const VIDEO_SRC = '/Videos/12k LP.mp4'; // Original Video
    const PAYMENT_LINK = 'https://rzp.io/rzp/UXqxhqx6';

    return (
        <main className="flex flex-col overflow-x-hidden relative selection:bg-red-500/30 selection:text-red-200 bg-black">
            <ThemeOverride />
            <GlobalBackground />

            {/* New Hero Design */}
            <NewYearHero
                videoThumbnail="/Photos/12k-video-cover.jpg"
                videoSrc="/Videos/12k LP.mp4"
            />

            {/* Problem Agitation Section */}
            <ProblemSection />


            {/* Live Demos Section */}
            <LiveDemos />

            {/* Offer Highlight Banner */}
            <div className="w-full overflow-hidden relative z-20 py-4">
                <div className="bg-red-600 text-white py-3 border-y border-white/10 rotate-1 scale-105 shadow-xl">
                    <div className="flex animate-marquee whitespace-nowrap gap-12 font-bold tracking-wider text-sm md:text-base items-center">
                        {[...Array(10)].map((_, i) => (
                            <span key={i} className="flex items-center gap-3">
                                <Zap className="h-4 w-4 fill-current" /> FOUNDER KICKSTARTER OFFER ₹ {PRICE.toLocaleString()} ONLY <Zap className="h-4 w-4 fill-current" />
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <FeaturesBrowser />

            {/* Testimonials Section */}
            <Testimonials />

            {/* Order Flow Showcase */}
            <OrderFlow />

            {/* Comparison Section */}
            <ComparisonTable />

            {/* Setup Process */}
            <section className="container mx-auto px-4 py-32 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20 relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <Zap className="w-3 h-3 fill-current" /> Fast Track
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">
                        From Idea to Brand in <span className="text-red-600 underline decoration-4 decoration-red-200 dark:decoration-red-900/50 underline-offset-4">24 Hours</span>
                    </h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-light">
                        We've optimized the launch process. No drag-and-drop headaches. Just results.
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
                        {[
                            {
                                step: "01",
                                title: "Share Requirements",
                                desc: "Fill a structured form with your product details, colors, and vision. Takes 5 mins.",
                                icon: <ClipboardList className="w-10 h-10 text-red-600 dark:text-red-500" />,
                                color: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                            },
                            {
                                step: "02",
                                title: "We Develop",
                                desc: "Our pro team builds your store, sets up payments, and configures shipping.",
                                icon: <Code2 className="w-10 h-10 text-red-600 dark:text-red-500" />,
                                color: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                            },
                            {
                                step: "03",
                                title: "Launch & Train",
                                desc: "Handover in 24 hours. We give you a 1:1 training session to manage your empire.",
                                icon: <Rocket className="w-10 h-10 text-red-600 dark:text-red-500" />,
                                color: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                            },
                        ].map((s, i) => (
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
                                        {s.icon}
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
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section (Bottom) */}
            <div className="py-12">
                <Pricing price={PRICE} originalPrice={ORIGINAL_PRICE} source={SOURCE} paymentLink={PAYMENT_LINK} />
            </div>

            {/* FAQ */}
            <section className="py-16 bg-transparent border-t border-white/5 relative z-10">
                <FAQ />
            </section>

            <Footer />
            {/* Sticky Scroll CTA */}
            <StickyCTA price={PRICE} source={SOURCE} paymentLink={PAYMENT_LINK} />
        </main>
    );
}
