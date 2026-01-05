'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { BookingModal } from './BookingModal';

interface PricingProps {
    price?: number;
    originalPrice?: number;
    title?: string;
    source?: string;
    paymentLink?: string;
}

export function Pricing({
    price = 5000,
    originalPrice = 15000,
    title = "Founder's Starter Plan",
    source = 'website',
    paymentLink
}: PricingProps) {
    return (
        <div className="w-full max-w-sm mx-auto perspective-1000">
            <motion.div
                whileHover={{ scale: 1.02, rotateY: 2 }}
                className="relative"
            >
                <Card className="relative border border-zinc-800 bg-zinc-950/60 backdrop-blur-md shadow-xl hover:shadow-red-900/20 hover:border-red-900/30 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-600 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl shadow-sm backdrop-blur-sm">
                        BEST VALUE
                    </div>

                    <CardHeader className="text-center pb-2 pt-8">
                        <CardTitle className="text-3xl font-bold text-white">
                            {title}
                        </CardTitle>
                        <CardDescription className="text-base text-zinc-400">Perfect for validating your idea</CardDescription>
                    </CardHeader>

                    <CardContent className="text-center">
                        <div className="flex justify-center items-end gap-2 mb-2">
                            <span className="text-5xl font-extrabold tracking-tight text-white">₹{price.toLocaleString()}</span>
                            <span className="text-xl text-zinc-500 mb-1 line-through opacity-70">₹{originalPrice.toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-medium mb-6 bg-red-600/10 text-red-500 py-1 px-3 rounded-full inline-block border border-red-600/20">
                            One-time payment. Lifetime access.
                        </p>

                        <ul className="text-left space-y-4 mb-6">
                            {[
                                "Complete e-commerce website",
                                "Admin dashboard included",
                                "Payment gateway integration",
                                "Free hosting for 1st year",
                                "Basic SEO setup",
                                "Email automation setup"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                    <div className="h-6 w-6 rounded-full bg-red-600/10 flex items-center justify-center flex-shrink-0 text-red-500">
                                        <Check className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3 pb-6 px-6">
                        <BookingModal type="book" amount={price} source={source} paymentLink={paymentLink}>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-lg shadow-lg shadow-red-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                Get Instant Access
                            </motion.button>
                        </BookingModal>
                        <div className="pt-2 w-full">
                            <BookingModal type="book" triggerText="Talk to an Expert" source={source} />
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}
