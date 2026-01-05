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
        const fetchTargetDate = async () => {
            try {
                // Default to 15th Jan if fetch fails
                let targetTime = new Date('January 15, 2026 00:00:00').getTime();

                const res = await fetch('/api/admin/settings');
                const data = await res.json();

                if (data.offer_end_date) {
                    targetTime = new Date(data.offer_end_date).getTime();
                }

                startTimer(targetTime);
            } catch (error) {
                console.error('Failed to fetch timer date:', error);
                // Fallback
                startTimer(new Date('January 15, 2026 00:00:00').getTime());
            }
        };

        const startTimer = (targetDate: number) => {
            const now = new Date().getTime();
            // Just use targetDate directly, no 24h fallback for this specific offer unless needed
            const deadline = targetDate;

            const interval = setInterval(() => {
                const now = new Date().getTime();
                const distance = deadline - now;

                if (distance < 0) {
                    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
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

            // Cleanup function assignment
            return () => clearInterval(interval);
        };

        fetchTargetDate();
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
