'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Hourglass, Languages, Play } from 'lucide-react';
import React from 'react';
import { VideoDialog } from '@/components/landing/VideoDialog';

interface NewYearHeroProps {
    videoThumbnail?: string;
    videoSrc?: string;
    headline?: React.ReactNode;
    subheadline?: string;
    announcementBadge?: string;
    ctaText?: string;
    offerEndRequest?: string | null;
}

export function NewYearHero({
    videoThumbnail = "/Photos/5k-video-cover.jpg",
    videoSrc = "/Videos/5k LP.mp4",
    headline,
    subheadline,
    announcementBadge = "FLASH SALE LIVE",
    ctaText = "Get Instant Access",
    offerEndRequest
}: NewYearHeroProps) {
    // Determine the date to show
    const targetDateStr = offerEndRequest || '2026-01-15';

    return (
        <section className="relative pt-12 pb-16 md:pt-24 md:pb-32 overflow-hidden bg-black text-white min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center items-center">

            {/* Background Texture/Noise */}
            <div className="absolute inset-0 bg-[#050505]">
                <div className="absolute inset-0 opacity-[0.2]"
                    style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}>
                </div>

                {/* Spotlights */}
                <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay" />
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] mix-blend-overlay" />

                {/* Red Ambient Glow */}
                <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-red-600/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[20%] w-[500px] h-[500px] bg-red-600/30 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">

                {/* Top Timer Pill - Matching Design */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 inline-flex items-center bg-white rounded-lg p-1 pr-4 shadow-lg shadow-white/5"
                >
                    <span className="bg-black text-white text-sm font-medium px-3 py-1.5 rounded-md mr-3">
                        {announcementBadge}
                    </span>
                    <SimpleTimer targetDate={new Date(targetDateStr)} />
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl/tight lg:text-7xl/tight font-black tracking-tight max-w-5xl mb-6"
                >
                    {headline || (
                        <>
                            <span className="text-red-500">Launch Your Brand</span> That You Have Always Dreamed Of After Building <span className="text-red-500">Your Own Store</span>
                        </>
                    )}
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-2xl text-zinc-400 max-w-3xl mb-12 font-light leading-relaxed"
                >
                    {subheadline || "Unlock the simple system top brands use to attract customers, get sales, and scale fast with our exclusive complete tech package."}
                </motion.p>

                {/* Video Placeholder */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl border-[6px] border-zinc-800 bg-zinc-900 group cursor-pointer"
                >
                    {/* Video Thumbnail/Content */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <img
                        src={videoThumbnail}
                        alt="Masterclass Thumbnail"
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                    />

                    {/* Play Button Center */}
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20" />
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center pl-1 shadow-lg">
                                    <Play className="w-6 h-6 text-white fill-current" />
                                </div>
                            </div>

                            {/* "Click Here Play" Arrow - SVG Drawing */}
                            <div className="absolute left-[85%] top-[10%] w-40 hidden md:block pointer-events-none">
                                <svg width="150" height="80" viewBox="0 0 150 80" className="text-white fill-none stroke-current stroke-2 overflow-visible">
                                    {/* Path pointing AT the button (left) FROM the text (right) */}
                                    <path d="M110,60 Q60,70 10,30" markerEnd="url(#arrowhead)" />
                                    <defs>
                                        <marker id="arrowhead" markerWidth="14" markerHeight="10" refX="12" refY="5" orient="auto">
                                            <polygon points="0 0, 14 5, 0 10" fill="currentColor" />
                                        </marker>
                                    </defs>
                                </svg>
                                <span className="text-xl font-handwriting absolute top-14 left-16 -rotate-6 text-white whitespace-nowrap drop-shadow-md">Click Here Play</span>
                            </div>
                        </div>
                    </div>

                    {/* We can wrap standard VideoDialog or custom onClick here but for visual matching I used the layout above */}
                    <div className="absolute inset-0 z-30 opacity-0">
                        <VideoDialog videoSrc={videoSrc} />
                    </div>
                </motion.div>

                {/* Info Grid - Bottom */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-4xl"
                >
                    <InfoBox icon={<Calendar className="text-red-500" />} label="Offer Valid Until" value={new Date(targetDateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                    <InfoBox icon={<Clock className="text-red-500" />} label="Setup Time" value="24 - 48 Hours" />
                    <InfoBox icon={<Hourglass className="text-red-500" />} label="Duration" value="1 Year Access" />
                    <InfoBox icon={<Languages className="text-red-500" />} label="Support" value="English & Hindi" />
                </motion.div>

            </div>
        </section>
    );
}


function InfoBox({ icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-start gap-3 backdrop-blur-sm hover:border-red-500/30 transition-colors text-left">
            <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                {icon}
            </div>
            <div>
                <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-0.5">{label}</p>
                <p className="text-white font-semibold">{value}</p>
            </div>
        </div>
    );
}

function SimpleTimer({ targetDate }: { targetDate: Date }) {
    const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    React.useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate.getTime() - now;

            // Fallback logic for demo (reset 24h) if passed
            const finalDist = distance < 0 ? (new Date().getTime() + 86400000 - new Date().getTime()) : distance; // Simple dummy fallback if needed, or just 0

            setTimeLeft({
                days: Math.floor(finalDist / (1000 * 60 * 60 * 24)),
                hours: Math.floor((finalDist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((finalDist % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((finalDist % (1000 * 60)) / 1000),
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className="font-mono font-medium text-black text-lg tracking-widest tabular-nums">
            {pad(timeLeft.days)} : {pad(timeLeft.hours)} : {pad(timeLeft.minutes)} : {pad(timeLeft.seconds)}
        </div>
    );
}
