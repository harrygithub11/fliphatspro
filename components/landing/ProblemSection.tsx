'use client';

import { motion } from 'framer-motion';

const cards = [
    {
        title: "CHAOTIC SALES",
        heading: "Relying on Instagram, WhatsApp & random ads for sales?",
        text: "No real system. No control. Just juggling DMs, posts, and hoping today converts better than yesterday.",
        img: "/Photos/Overwhelmed entrepreneur amidst digital chaos.png"
    },
    {
        title: "SUBSCRIPTION FATIGUE",
        heading: "Tired of monthly platform fees eating your profit?",
        text: "Paying every month for your own store — and still feeling like you don’t really own it.",
        img: "/Photos/Facing financial stress and overdue bills.png"
    },
    {
        title: "LOCKED & LIMITED",
        heading: "Stuck with “upgrade required” and limited control?",
        text: "Want to customize, scale, or grow — but the platform keeps saying no unless you pay more.",
        img: "/Photos/Tech trouble and upgrade frustration.png"
    }
];

export function ProblemSection() {
    return (
        <section className="py-20 bg-zinc-950 text-white overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-black to-transparent z-0 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center mb-16 relative">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-black tracking-tight mb-2"
                    >
                        Does This <span className="text-red-600">Sound Like You?</span>
                    </motion.h2>

                    {/* Handwritten annotation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="absolute -top-8 right-[5%] md:right-[25%] hidden md:block"
                    >
                        <div className="relative">
                            <span className="font-handwriting text-2xl text-zinc-300">Sounds familiar?</span>
                            <svg className="absolute top-8 right-[-20px] w-12 h-12 text-zinc-300 fill-none stroke-current stroke-2" viewBox="0 0 50 50">
                                <path d="M10,0 Q30,20 10,40" markerEnd="url(#arrow-problem)" />
                                <defs>
                                    <marker id="arrow-problem" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                                        <path d="M0,0 L10,5 L0,10" fill="currentColor" />
                                    </marker>
                                </defs>
                            </svg>
                        </div>
                    </motion.div>
                </div>

                {/* Cards Grid */}
                <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {cards.map((card, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden hover:border-red-600/50 transition-colors group flex flex-col"
                        >
                            {/* Image with overlay gradient */}
                            <div className="h-64 relative overflow-hidden bg-zinc-800">
                                <img
                                    src={card.img}
                                    alt={card.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-90" />

                                {/* Badge */}
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    {card.title}
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="px-6 md:px-8 pb-8 md:pb-10 pt-6 flex-1 flex flex-col justify-end">
                                <h3 className="text-xl font-bold mb-4 leading-tight">
                                    {card.heading}
                                </h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">
                                    {card.text}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Transition Text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-16 text-center max-w-2xl mx-auto space-y-6"
                >
                    <p className="text-xl text-zinc-300 font-medium">
                        If even one of these hit close to home — <span className="text-white font-bold underline decoration-red-600 decoration-2 underline-offset-4">you’re not alone.</span>
                        <br />
                        And more importantly, you’re not stuck.
                    </p>

                    <div className="w-16 h-1 bg-red-600 mx-auto rounded-full" />

                    <p className="text-2xl font-black tracking-tight text-white">
                        Here’s a better way to launch and own your store.
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
