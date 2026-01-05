'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookingModal } from '@/components/landing/BookingModal';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Play } from 'lucide-react';

interface StickyCTAProps {
    price: number;
    originalPrice?: number;
    source: string;
    ctaConfig?: any; // { primary_mode, modes }
    paymentLink?: string; // Fallback
    offerEndDate?: string | null;
}

export function StickyCTA({ price, originalPrice = 12000, source, ctaConfig, paymentLink, offerEndDate }: StickyCTAProps) {
    const [show, setShow] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            // Show after scrolling 300px
            if (window.scrollY > 300) {
                setShow(true);
            } else {
                setShow(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const dateStr = offerEndDate ? new Date(offerEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Limited Time Offer';

    if (!mounted) return null;

    // If source/paymentLink are handled by BookingModal, we pass them.
    // The design: 
    // Left: Price "Rs. 499/- Rs. 249/- Only on 3rd January 2026" 
    // Right: Gradient Button "Register Now" with arrow/play

    // Use Portal to break out of any overflow:hidden or transform constraints of parent
    return createPortal(
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-6 left-4 right-4 md:left-0 md:right-0 md:mx-auto md:w-full md:max-w-3xl z-[100]"
                >
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2 md:p-3 shadow-2xl flex items-center justify-between gap-4">

                        {/* Left: Pricing Info */}
                        <div className="flex flex-col pl-3">
                            <div className="flex items-center gap-2 text-sm md:text-base">
                                <span className="text-zinc-500 line-through font-medium">Rs. {originalPrice.toLocaleString()}/-</span>
                                <span className="text-white font-bold">Rs. {price.toLocaleString()}/- Only</span>
                            </div>
                            <span className="text-[10px] md:text-xs text-zinc-400 font-medium tracking-wide">
                                Offer Valid Until {dateStr}
                            </span>
                        </div>

                        {/* Right: Action Button */}
                        <div>
                            {(() => {
                                const mode = ctaConfig?.primary_mode || 'booking';
                                const modes = ctaConfig?.modes || {};
                                const currentConfig = modes[mode] || {};

                                let modalType: 'book' | 'pay' | 'link' = 'book';
                                let targetLink = paymentLink;
                                let btnText = 'Book a Call';

                                if (mode === 'razorpay_api') {
                                    modalType = 'pay';
                                    targetLink = undefined;
                                    btnText = currentConfig.button_text || 'Buy Now';
                                } else if (mode === 'payment_link') {
                                    modalType = 'link';
                                    targetLink = currentConfig.url || paymentLink;
                                    btnText = currentConfig.button_text || 'Buy Now';
                                } else if (mode === 'booking') {
                                    modalType = 'link';
                                    targetLink = currentConfig.url;
                                    btnText = currentConfig.button_text || 'Book Strategy Call';
                                } else if (mode === 'lead_form') {
                                    modalType = 'book';
                                    targetLink = undefined;
                                    btnText = currentConfig.button_text || 'Get Access';
                                }

                                const cta_amount = modes.razorpay_api?.amount ? modes.razorpay_api.amount / 100 : price;

                                return (
                                    <BookingModal
                                        type={modalType}
                                        source={`${source}:sticky`}
                                        paymentLink={targetLink}
                                        amount={cta_amount}
                                        triggerText={btnText}
                                    >
                                        <button className="group relative flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm md:text-base shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02]">
                                            <span>{btnText}</span>
                                            <div className="bg-white/20 rounded-md p-1 group-hover:translate-x-0.5 transition-transform">
                                                <Play className="w-3 h-3 fill-current" />
                                            </div>
                                        </button>
                                    </BookingModal>
                                );
                            })()}
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
