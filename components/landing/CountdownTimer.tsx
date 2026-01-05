'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        // Set deadline to 3 days from now for demo purposes, or a fixed New Year date
        // For specific New Year offer: Jan 1st of next year
        const now = new Date();
        const currentYear = now.getFullYear();
        const targetDate = new Date(`January 1, ${currentYear + 1} 00:00:00`).getTime();

        // Fallback if already passed (e.g. for demo continuity) -> set to 24 hours from now
        const fallbackDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime();

        const deadline = targetDate > now.getTime() ? targetDate : fallbackDate;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = deadline - now;

            if (distance < 0) {
                clearInterval(interval);
                return;
            }

            setTimeLeft({
                days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000),
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const timeUnits = [
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Mins', value: timeLeft.minutes },
        { label: 'Secs', value: timeLeft.seconds },
    ];

    return (
        <div className="flex justify-center gap-4 py-6">
            {timeUnits.map((unit, index) => (
                <motion.div
                    key={unit.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center bg-background/50 backdrop-blur-sm border rounded-lg p-3 min-w-[70px] md:min-w-[90px] shadow-sm"
                >
                    <span className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-600 font-mono">
                        {unit.value.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{unit.label}</span>
                </motion.div>
            ))}
        </div>
    );
}
