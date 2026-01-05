'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const defaultSteps = [
    {
        title: "Browse Products",
        desc: "Your customers browse your beautiful store.",
        image: "/Photos/Orderflow01.png",
        icon: "ShoppingBag"
    },
    {
        title: "Add to Cart",
        desc: "Seamless one-click add to cart experience.",
        image: "/Photos/Orderflow02.png",
        icon: "ShoppingCart"
    },
    {
        title: "Checkout",
        desc: "Simple checkout page optimized for conversions.",
        image: "/Photos/Orderflow04.png",
        icon: "CreditCard"
    },
    {
        title: "Order Success",
        desc: "Instant order confirmation and invoice generation.",
        // @ts-ignore
        images: ["/Photos/ordersucusspage01.png", "/Photos/emailrecive01.png"],
        icon: "CheckCircle"
    }
];

interface OrderFlowProps {
    title?: string;
    subtitle?: string;
    items?: any[];
}

export function OrderFlow({
    title = "Experience the Seamless Buying Flow",
    subtitle = "Your customers get a world-class shopping experience from product to payment.",
    items = []
}: OrderFlowProps) {
    const steps = items.length > 0 ? items : defaultSteps;
    const [currentStep, setCurrentStep] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!isHovered && steps.length > 0) {
            const timer = setInterval(() => {
                setCurrentStep((prev) => (prev + 1) % steps.length);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [isHovered, steps.length]);

    const nextStep = () => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
    };

    const prevStep = () => {
        setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    };

    return (
        <section
            className="py-24 bg-transparent overflow-hidden relative z-10"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">{title}</h2>
                    <p className="text-lg text-zinc-400">{subtitle}</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 items-center">
                    {/* Steps Navigation (Desktop) */}
                    <div className="lg:col-span-4 space-y-4 hidden lg:block">
                        {steps.map((step, index) => {
                            const IconMap: any = { ShoppingBag, ShoppingCart, CreditCard, CheckCircle };
                            const Icon = typeof step.icon === 'string' ? (IconMap[step.icon] || ShoppingBag) : step.icon;

                            return (
                                <div
                                    key={index}
                                    onClick={() => setCurrentStep(index)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 border flex items-center gap-4 ${currentStep === index
                                        ? "bg-red-600 text-white border-red-500 shadow-lg scale-105"
                                        : "bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 hover:border-red-600/30"
                                        }`}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${currentStep === index ? "bg-white/20" : "bg-zinc-800 text-zinc-500"}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${currentStep === index ? "text-white" : "text-zinc-300"}`}>{step.title}</h3>
                                        <p className={`text-xs ${currentStep === index ? "text-white/80" : "text-zinc-500"}`}>{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Image Display */}
                    <div className="lg:col-span-8 relative">
                        <div className="relative aspect-[16/10] bg-muted rounded-2xl overflow-hidden border shadow-2xl flex items-center justify-center bg-zinc-950">
                            <AnimatePresence mode="wait">
                                {/* Check if current step has multiple images */}
                                {/* @ts-ignore */}
                                {steps[currentStep].images ? (
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 w-full h-full p-4 flex gap-4 items-center justify-center"
                                    >
                                        {/* @ts-ignore */}
                                        {steps[currentStep].images.map((img, i) => (
                                            <img key={i} src={img} alt="Order Success" className="h-full object-contain rounded-2xl shadow-lg brightness-90" />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <motion.img
                                        key={currentStep}
                                        /* @ts-ignore */
                                        src={steps[currentStep].image}
                                        alt={steps[currentStep].title}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 w-full h-full object-contain p-4 rounded-3xl brightness-90"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Mobile Navigation Overlays */}
                            <div className="absolute inset-0 flex items-center justify-between p-4 lg:hidden pointer-events-none">
                                <Button variant="ghost" size="icon" onClick={prevStep} className="pointer-events-auto rounded-full h-10 w-10 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={nextStep} className="pointer-events-auto rounded-full h-10 w-10 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors">
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Step Indicator (Mobile) */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 lg:hidden">
                                {steps.map((_, i) => (
                                    <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? "w-6 bg-red-600" : "w-2 bg-white/30"}`} />
                                ))}
                            </div>
                        </div>

                        {/* Text Description (Mobile) */}
                        <div className="mt-6 text-center lg:hidden">
                            <h3 className="text-xl font-bold mb-2 text-white">{steps[currentStep].title}</h3>
                            <p className="text-zinc-300">{steps[currentStep].desc}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
