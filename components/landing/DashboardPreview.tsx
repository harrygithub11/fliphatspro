'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { BookingModal } from "./BookingModal";

// Using the same customized dashboard images
const DASHBOARD_IMAGES = [
    '/Photos/Customdash06.png',
    '/Photos/Customdash07.png',
    '/Photos/Customdash08.png',
    '/Photos/Customdash09.png',
    '/Photos/Customdash10.png',
    '/Photos/Customdash11.png',
    '/Photos/Customdash12.png',
    '/Photos/Customdash13.png',
];

export function DashboardPreview() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % DASHBOARD_IMAGES.length);
        }, 3000); // Shuffle every 3 seconds
        return () => clearInterval(interval);
    }, []);

    const getImageStyle = (index: number) => {
        // Calculate visual position relative to active index
        const position = (index - activeIndex + DASHBOARD_IMAGES.length) % DASHBOARD_IMAGES.length;

        // Stacking logic
        return {
            x: position * 25 - 30,
            y: position * 3,
            z: -position * 80,
            rotateY: 5,
            rotateX: 5,
            rotateZ: 0,
            scale: 1.1 - (position * 0.08),
            zIndex: DASHBOARD_IMAGES.length - position,
            opacity: 1,
            // Border logic: Thicker black border for the top item
            border: position === 0 ? '4px solid #000000' : '1px solid rgba(0,0,0,0.1)',
        };
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-12 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                {/* Visual Side - 3D Fan Out Effect */}
                <div className="relative h-[400px] md:h-[600px] w-full flex items-center justify-center perspective-[2000px]">
                    {DASHBOARD_IMAGES.map((img, index) => {
                        const style = getImageStyle(index);

                        return (
                            <motion.div
                                key={index}
                                animate={style}
                                initial={false}
                                transition={{
                                    duration: 0.8,
                                    ease: "easeInOut",
                                }}
                                className="absolute w-[85%] md:w-[85%] bg-white rounded-xl shadow-[20px_20px_40px_rgba(0,0,0,0.25)] overflow-hidden"
                                style={{
                                    transformStyle: "preserve-3d",
                                    transformOrigin: "center center",
                                }}
                            >
                                <img
                                    src={img}
                                    alt={`Dashboard Screen ${index + 1}`}
                                    className="w-full h-auto object-cover"
                                />
                                {/* Gloss Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                            </motion.div>
                        );
                    })}
                </div>

                {/* Content Side */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <LayoutDashboard className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-sm font-bold tracking-wider text-primary uppercase">Powerful Admin Panel</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground uppercase">
                            DASHBOARD <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-black dark:to-white">PREVIEW</span>
                        </h2>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                            Manage your entire business from a single, powerful dashboard. Track sales, manage inventory, and get real-time insights—all in one place.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <BookingModal type="book" triggerText="Get Started Now" />
                        <BookingModal type="book" source="dashboard_preview_demo">
                            <Button variant="outline" className="h-14 rounded-2xl px-8 text-base font-medium hover:bg-zinc-50 border-zinc-200">
                                View Live Demo <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </BookingModal>
                    </div>

                    {/* Trust Indicators */}
                    <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-bold text-2xl">24/7</h4>
                            <p className="text-sm text-muted-foreground">Support Available</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-2xl">100%</h4>
                            <p className="text-sm text-muted-foreground">Uptime Guarantee</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
