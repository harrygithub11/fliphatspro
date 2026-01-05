'use client';

import { motion } from 'framer-motion';
import { Star, Quote, MapPin, CheckCircle2, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TestimonialItem {
    name: string;
    role: string;
    content: string;
    location?: string;
    initials?: string;
    color?: string;
}

interface TestimonialsProps {
    testimonials?: TestimonialItem[];
}

export function Testimonials({ testimonials = [] }: TestimonialsProps) {
    // Fallback data
    const data = (testimonials && testimonials.length > 0) ? testimonials : [
        {
            name: "Rajesh S.",
            role: "Founder, UrbanKicks Delhi",
            content: "I was paying ₹2000/month just for Shopify. With FliphatMedia, I paid once and now I own my store completely. The UPI integration is flawless for my customers.",
            location: "New Delhi",
            initials: "RS",
            color: "bg-red-900/20 text-red-500 border-red-900/30"
        },
        // ... (keep 1-2 examples or just use the full list as fallback if needed)
        {
            name: "Priya Patel",
            role: "Owner, EthnicWeave",
            content: "My saree business needed a premium website. The team helped me setup everything in 24 hours. My sales have increased by 40% since launching.",
            location: "Ahmedabad",
            initials: "PP",
            color: "bg-zinc-900 text-zinc-400 border-zinc-800"
        }
    ];
    return (
        <section className="py-24 bg-transparent relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-3xl mx-auto mb-16"
                >
                    <Badge variant="outline" className="mb-4 px-4 py-1 border-red-900/50 text-red-500 bg-red-900/10">Real Stories</Badge>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight text-white">Trusted by 1000+ Indian Founders</h2>
                    <p className="text-lg text-zinc-400">Join the growing community of smart business owners who switched to owning their platform.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {data.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-zinc-950/40 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-red-900/10 hover:border-red-900/30 transition-all duration-300 relative group"
                        >
                            <Quote className="absolute top-6 right-6 h-8 w-8 text-zinc-800 group-hover:text-red-900/50 transition-colors" />

                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, starI) => (
                                    <Star key={starI} className="h-4 w-4 fill-red-500 text-red-500" />
                                ))}
                            </div>

                            <p className="text-zinc-300 leading-relaxed mb-6 min-h-[80px]">
                                "{t.content}"
                            </p>

                            <div className="flex items-center gap-4 pt-4 border-t border-dashed border-zinc-800">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg border bg-zinc-900 border-zinc-700 text-zinc-400 overflow-hidden`}>
                                    {t.initials ? t.initials : <User className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-base flex items-center gap-2 text-white">
                                        {t.name}
                                        {/* Verified Badge */}
                                        <CheckCircle2 className="h-3 w-3 text-blue-500 fill-blue-500/10" />
                                    </h4>
                                    <p className="text-xs text-red-500 font-medium mb-0.5">{t.role}</p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" /> {t.location}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Missing avatar import mock if needed, but using simple divs for initials to be safe and fast.
