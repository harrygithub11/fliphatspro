'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap, Laptop, BarChart, CreditCard, Rocket, Lock, Timer, Check, X, Play, Clock, Shield, Sparkles, Smartphone, Globe, Code2, ClipboardList } from 'lucide-react';
import { VideoDialog } from '@/components/landing/VideoDialog';
import { Button } from '@/components/ui/button';
import { BookingModal } from '@/components/landing/BookingModal';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { CountdownTimer } from '@/components/landing/CountdownTimer';
import { OrderFlow } from '@/components/landing/OrderFlow';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Testimonials } from '@/components/landing/Testimonials';
import { motion } from 'framer-motion';
import { FeaturesBrowser } from '@/components/landing/FeaturesBrowser';
import { LiveDemos } from '@/components/landing/LiveDemos';
import { ComparisonTable } from '@/components/landing/ComparisonTable';

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

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col overflow-x-hidden bg-background selection:bg-primary/20 selection:text-primary">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="fixed w-full z-50 top-0 left-0 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
            >
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <img src="/Photos/logo.png" alt="FliphatMedia" className="h-8 w-auto" />
                        <span className="font-bold text-xl tracking-tight">FliphatMedia</span>
                    </div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-base font-cursive font-bold bg-red-500/10 text-red-600 px-4 py-1.5 rounded-full border border-red-200 cursor-default flex items-center gap-2"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Offer Ends Soon
                    </motion.div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-12 md:pt-40 md:pb-32 overflow-hidden min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center">

                {/* Background Pattern - Animated Moving Grid */}
                <motion.div
                    initial={{ backgroundPosition: "0px 0px" }}
                    animate={{ backgroundPosition: "0px -40px" }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 2 }}
                    className="absolute inset-0 bg-grid-pattern [mask-image:linear-gradient(to_bottom,white,transparent)] pointer-events-none z-0"
                />

                {/* Animated Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 90, 0],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            x: [0, -50, 0],
                            opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] bg-red-600/10 rounded-full blur-[120px]"
                    />
                </div>

                <div className="container mx-auto px-4 z-10">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Column: Text Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="text-left"
                        >
                            <motion.div variants={fadeInUp} className="inline-block mb-6 relative">
                                <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full opacity-50 animate-pulse" />
                                <span className="relative py-2 px-6 rounded-full text-lg font-cursive bg-gradient-to-r from-red-50 to-white dark:from-zinc-900 dark:to-zinc-800 text-primary border border-red-100 dark:border-red-900/30 shadow-sm flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    Built for Founders & Startups
                                </span>
                            </motion.div>

                            <motion.h1 variants={fadeInUp} className="text-3xl md:text-6xl font-black tracking-tight mb-4 md:mb-6 leading-[1.1] selection:bg-red-100">
                                Your Idea Deserves a Store, <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-600 via-red-500 to-black dark:to-white drop-shadow-sm">
                                    Not a Subscription.
                                </span>
                            </motion.h1>

                            <motion.p variants={fadeInUp} className="text-base md:text-xl text-muted-foreground/80 mb-6 md:mb-8 leading-relaxed font-light max-w-xl">
                                The most founder-friendly launchpad. One-time setup. <br className="hidden md:block" />
                                <span className="text-foreground font-semibold">Zero monthly fees. We build it, you own it.</span>
                            </motion.p>

                            <motion.div variants={fadeInUp} className="mb-6 md:mb-10">
                                <div className="flex justify-start">
                                    <CountdownTimer />
                                </div>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
                                <BookingModal type="book" triggerText="Book a Free Strategy Call" />
                                <p className="hidden sm:block text-sm text-zinc-400 font-medium px-2 uppercase tracking-widest text-[10px]">or</p>
                                <Button
                                    variant="outline"
                                    className="group h-10 md:h-12 w-full sm:w-auto px-6 rounded-full border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all duration-300"
                                    onClick={() => window.open('https://demo.fliphatmedia.com/', '_blank')}
                                >
                                    View Live Store <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform text-red-500" />
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Right Column: Video Loop */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 50 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 1, type: "spring" }}
                            className="relative w-full"
                        >
                            {/* Background Glow Animation */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-full blur-[100px] animate-pulse -z-10" />

                            <VideoDialog videoSrc="/Videos/5k LP.mp4" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Post-Hero Video Section (New Year Offer) */}
            <section className="container mx-auto px-4 py-12 relative z-10">
                <div className="w-full md:w-[70%] mx-auto relative group">
                    {/* Border & Label Container */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 rounded-3xl blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

                    <div className="relative rounded-2xl bg-black p-1">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-800 text-white px-8 py-2 rounded-full font-bold tracking-widest shadow-lg z-20 border-2 border-yellow-500/50 uppercase text-sm md:text-base whitespace-nowrap flex items-center gap-2">
                            ✨ New Year Offer - ₹5,000 Only ✨
                        </div>

                        <div className="rounded-xl overflow-hidden relative bg-black/50 aspect-video">
                            {/* Replaced 'webpreview' with the main video or a dedicated offer video if available. Using 5k LP again or mainvideo as placeholder if webpreview is broken/missing, but user asked for 'instant section'. 
                                Actually, the user wants a PAYMENT section. I will overlay the payment button ON this video/section.
                            */}
                            <video
                                className="w-full h-full object-cover opacity-60"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source src="/Videos/mainvideo01.mp4" type="video/mp4" />
                            </video>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40 backdrop-blur-sm">
                                <h3 className="text-3xl md:text-5xl font-black text-white mb-6 drop-shadow-lg">
                                    Launch Your Brand <br /> in <span className="text-red-500">24 Hours</span>
                                </h3>
                                <div className="scale-125">
                                    <BookingModal type="pay" triggerText="Unlock Instant Access Now" />
                                </div>
                                <p className="text-zinc-300 mt-4 text-sm md:text-base max-w-md">
                                    Get the complete e-commerce stack + source code ownership. <br />
                                    <span className="text-yellow-400 font-bold">Limited to first 50 founders.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Demos Section (Replaces Dashboard Showcase) */}
            <LiveDemos />

            {/* Offer Highlight Banner */}
            <div className="bg-primary text-primary-foreground py-3 overflow-hidden border-y border-primary-foreground/10 rotate-1 scale-105 shadow-xl z-20 relative">
                <div className="flex animate-marquee whitespace-nowrap gap-12 font-bold tracking-wider text-sm md:text-base items-center">
                    {[...Array(10)].map((_, i) => (
                        <span key={i} className="flex items-center gap-3">
                            <Zap className="h-4 w-4 fill-current" /> FOUNDER KICKSTARTER OFFER ₹ 5000 ONLY <Zap className="h-4 w-4 fill-current" />
                        </span>
                    ))}
                </div>
            </div>






            {/* Features Section (Browser Style) */}
            <FeaturesBrowser />



            {/* Testimonials Section */}
            <Testimonials />

            {/* Order Flow Showcase */}
            <OrderFlow />

            {/* Comparison Section (New Table) */}
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
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                        From Idea to Brand in <span className="text-red-600 underline decoration-4 decoration-red-200 dark:decoration-red-900/50 underline-offset-4">24 Hours</span>
                    </h2>
                    <p className="text-muted-foreground text-xl max-w-2xl mx-auto font-light">
                        We've optimized the launch process. No drag-and-drop headaches. Just results.
                    </p>
                </motion.div>

                <div className="relative max-w-6xl mx-auto z-10">
                    {/* Connecting Line (Desktop) */}
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
                                {/* Card */}
                                <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden">

                                    {/* Number Watermark */}
                                    <span className="absolute -top-6 -right-6 text-9xl font-black text-zinc-50 dark:text-zinc-900 select-none -z-10 group-hover:scale-110 transition-transform duration-500">
                                        {s.step}
                                    </span>

                                    {/* Icon Bubble */}
                                    <div className={`w-24 h-24 rounded-full ${s.color} border shadow-inner flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-300`}>
                                        {s.icon}
                                        <div className="absolute -bottom-2 bg-white dark:bg-zinc-800 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-zinc-100 dark:border-zinc-700 uppercase tracking-widest text-zinc-500">
                                            Step {s.step}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold mb-3 group-hover:text-red-600 transition-colors">{s.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {s.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-muted/20">
                <FAQ />
            </section>

            <Footer />
        </main>
    );
}
