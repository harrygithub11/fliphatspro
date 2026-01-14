'use client';

import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Footer } from '@/components/landing/Footer';
import { useState } from 'react';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate submission or hook up to same API
        setTimeout(() => {
            alert("Message sent! We'll get back to you shortly.");
            setLoading(false);
        }, 1500);
    };

    return (
        <main className="min-h-screen flex flex-col bg-zinc-950 text-white selection:bg-red-500/30">
            {/* Simple Navbar */}
            <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img src="/Photos/logo.png" alt="FliphatMedia" className="h-8 w-auto brightness-0 invert" />
                        <span className="font-bold text-xl tracking-tight">FliphatMedia</span>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="flex-1 container mx-auto px-4 py-20 flex flex-col lg:flex-row gap-12 lg:gap-24 items-center justify-center relative">

                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

                <div className="flex-1 max-w-xl z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-8">
                            Get in <span className="text-red-500">Touch</span>
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-12">
                            Have questions about our e-commerce solutions?
                            We're here to help you build your brand.
                            Reach out to us directly or fill out the form.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Call Us</h3>
                                    <p className="text-zinc-400">Mon-Fri from 8am to 5pm</p>
                                    <div className="flex flex-col mt-2 gap-1 text-zinc-300">
                                        <a href="tel:+919602003790" className="hover:text-red-500 transition-colors">+91 96020 03790</a>
                                        <a href="tel:+917600047765" className="hover:text-red-500 transition-colors">+91 76000 47765</a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Email Us</h3>
                                    <p className="text-zinc-400 mb-2">Speak to our friendly team</p>
                                    <a href="mailto:support@fliphatmedia.com" className="text-zinc-300 hover:text-red-500 transition-colors">support@fliphatmedia.com</a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Visit Us</h3>
                                    <p className="text-zinc-400 mb-2">Visit our office HQ</p>
                                    <p className="text-zinc-300">New Delhi, India</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="flex-1 w-full max-w-md z-10">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-sm"
                    >
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Name</label>
                                <Input required placeholder="Enter your name" className="bg-zinc-950 border-zinc-800 focus:border-red-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Email</label>
                                <Input required type="email" placeholder="Enter your email" className="bg-zinc-950 border-zinc-800 focus:border-red-500/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Message</label>
                                <Textarea required placeholder="How can we help you?" className="bg-zinc-950 border-zinc-800 min-h-[120px] focus:border-red-500/50" />
                            </div>
                            <Button disabled={loading} type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
                                {loading ? 'Sending...' : <><Send className="w-4 h-4 mr-2" /> Send Message</>}
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
