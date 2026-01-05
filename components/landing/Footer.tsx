"use client";

import { motion } from "framer-motion";
import { Instagram, Twitter, Linkedin, Heart, Send, ArrowUpRight, Mail, Phone } from "lucide-react";
import { BookingModal } from "./BookingModal";

export function Footer({ source = 'website' }: { source?: string }) {
    return (
        <footer className="bg-zinc-950 text-white pt-12 pb-24 md:pb-12 overflow-hidden relative">
            {/* Background Beams */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-red-600/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                {/* CTA Section */}
                <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-zinc-800 pb-10 mb-10 gap-10">
                    <div className="max-w-2xl">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
                        >
                            Ready to Own <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">
                                Your Brand?
                            </span>
                        </motion.h2>
                        <p className="text-zinc-400 text-lg md:text-xl max-w-lg leading-relaxed">
                            Stop renting your business. Start building an asset.
                            Join the revolution of founders who truly own their store.
                        </p>
                    </div>
                    <BookingModal type="book" source={`${source}:footer`}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="group relative px-8 py-4 bg-white text-black rounded-full text-lg font-bold flex items-center gap-2 overflow-hidden"
                        >
                            <span className="relative z-10">Get Started Now</span>
                            <ArrowUpRight className="w-5 h-5 relative z-10 group-hover:rotate-45 transition-transform" />
                            <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <div className="absolute inset-0 z-0 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <span className="absolute inset-0 z-10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none gap-2">
                                Let's Go <ArrowUpRight className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                            </span>
                        </motion.button>
                    </BookingModal>
                </div>

                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 border-b border-zinc-800 pb-10 mb-8">
                    {/* Brand Column */}
                    <div className="col-span-1 md:col-span-5 pr-8">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/Photos/logo.png" alt="FliphatMedia" className="h-8 w-auto brightness-0 invert" />
                            <span className="text-xl font-bold">FliphatMedia</span>
                        </div>
                        <p className="text-zinc-500 mb-8 leading-relaxed">
                            Empowering Indian founders with complete e-commerce ownership.
                            We build high-performance stores that you actually own. No monthly platform fees, no hidden traps.
                        </p>
                    </div>

                    {/* Links Columns */}
                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold mb-6 text-white">Platform</h4>
                        <ul className="space-y-4 text-zinc-500">
                            {['Features', 'Pricing', 'Live Demos', 'Showcase'].map((item) => (
                                <li key={item}>
                                    <a href="#" className="hover:text-red-500 transition-colors">{item}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <h4 className="font-bold mb-6 text-white">Company</h4>
                        <ul className="space-y-4 text-zinc-500">
                            <li>
                                <a href="#" className="hover:text-red-500 transition-colors">About Us</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-red-500 transition-colors">Contact</a>
                            </li>
                            <li>
                                <a href="/privacy" className="hover:text-red-500 transition-colors">Privacy Policy</a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-red-500 transition-colors">Terms</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact/Newsletter Column */}
                    <div className="col-span-1 md:col-span-3">
                        <h4 className="font-bold mb-6 text-white">Contact Us</h4>
                        <ul className="space-y-4 text-zinc-500 mb-8">
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-red-500" /> support@fliphatmedia.com
                            </li>
                            <li className="flex items-start gap-3">
                                <Phone className="w-4 h-4 text-red-500 mt-1" />
                                <div className="flex flex-col gap-1">
                                    <span>Harish Kumar: <a href="tel:+919602003790" className="hover:text-red-500 transition-colors">+91 96020 03790</a></span>
                                    <span>Harshdeep Kumar: <a href="tel:+917600047765" className="hover:text-red-500 transition-colors">+91 76000 47765</a></span>
                                </div>
                            </li>
                        </ul>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all placeholder:text-zinc-600"
                            />
                            <button className="absolute right-2 top-2 p-1.5 bg-red-600 rounded-md text-white hover:bg-red-700 transition-colors">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-600">
                    <p>© {new Date().getFullYear()} FliphatMedia. All rights reserved.</p>
                    <div className="flex items-center gap-1">
                        Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> in India
                    </div>
                </div>
            </div>
        </footer>
    );
}
