'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const Hero = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    })

    const [currentQuote, setCurrentQuote] = useState(0)

    const quotes = [
        "Marketing isn't about shouting louder it's about speaking smarter.",
        "Your brand deserves to be seen, heard, and remembered.",
        "Data-driven creativity that turns clicks into loyal customers.",
        "We don't just grow brands we build movements."
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentQuote((prev) => (prev + 1) % quotes.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [])

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3
            }
        }
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    }

    const flipVariants: Variants = {
        hidden: {
            opacity: 0,
            rotateY: -15,
            rotateX: 10
        },
        visible: {
            opacity: 1,
            rotateY: 0,
            rotateX: 0,
            transition: {
                duration: 1,
                ease: [0.22, 1, 0.36, 1]
            }
        }
    }

    return (
        <section id="home" className="relative h-screen flex flex-col overflow-hidden bg-paper">
            {/* Video Background - Scoped to Hero */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    style={{ transform: 'scaleX(-1)', transformOrigin: 'center' }}
                >
                    <source src="/website/images/herobg-showreel.mp4" type="video/mp4" />
                </video>
                {/* Video overlay for better text readability */}
                <div className="absolute inset-0 bg-paper/40" />
            </div>

            {/* Animated Border - Frames content area */}
            <div
                className="absolute left-4 right-4 md:left-8 md:right-8 top-24 md:top-20 lg:top-32 bottom-32 md:bottom-36 border-2 rounded-3xl pointer-events-none z-[5]"
                style={{
                    animation: 'border-color-change 8s linear infinite'
                }}
            />

            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.08, scale: 1 }}
                    transition={{ duration: 1.2 }}
                    className="absolute top-20 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[600px] md:h-[600px] bg-accent rounded-full blur-3xl"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.05, scale: 1 }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                    className="absolute bottom-20 left-0 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] md:w-[500px] md:h-[500px] bg-neutral-700 rounded-full blur-3xl"
                />

                {/* Floating grid pattern */}
                <svg className="absolute top-0 left-0 w-full h-full opacity-[0.015]" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" className="text-ink" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            {/* Main Content Area - Inside Border */}
            <div className="flex-1 flex items-center relative z-10 pt-32 md:pt-28 lg:pt-32">
                <div className="container-custom px-12 md:px-12 lg:px-16 w-full">
                    <motion.div
                        ref={ref}
                        variants={containerVariants}
                        initial="hidden"
                        animate={inView ? "visible" : "hidden"}
                        className="grid lg:grid-cols-2 gap-4 lg:gap-16 items-center max-w-7xl mx-auto"
                    >
                        {/* Left content */}
                        <div className="space-y-4 lg:space-y-6 text-center lg:text-left">
                            <motion.div variants={itemVariants} className="space-y-3">
                                <h1 className="text-2xl sm:text-3xl md:text-display-sm lg:text-display-md font-bold text-ink text-balance leading-tight">
                                    Fliphats{' '}
                                    <span className="inline-block bg-accent text-ink px-2 py-1 md:px-3 text-xl sm:text-2xl md:text-display-sm lg:text-display-md">
                                        Shaping
                                    </span>
                                    {' '}how the world sees your brand.
                                </h1>

                                <p className="text-sm sm:text-base md:text-body text-ink max-w-xl mx-auto lg:mx-0 text-balance">
                                    We blend creativity with strategy to help brands grow smarter, faster, and stronger.
                                </p>
                            </motion.div>

                            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                                <button className="btn-primary w-full sm:w-auto">
                                    Let&apos;s Talk
                                </button>
                                <button className="btn-secondary w-full sm:w-auto">
                                    Explore Our Work
                                </button>
                            </motion.div>

                            {/* Stats badges */}
                            <motion.div variants={itemVariants} className="hidden lg:flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start">
                                {[
                                    { value: '210%', label: 'ROAS in 45 days' },
                                    { value: '3x', label: 'Revenue growth' },
                                    { value: '40%', label: 'Cost reduction' }
                                ].map((stat, index) => (
                                    <div key={index} className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full flex-shrink-0" />
                                        <div>
                                            <div className="text-base sm:text-lg md:text-heading-md font-bold text-ink">{stat.value}</div>
                                            <div className="text-xs sm:text-sm md:text-body-sm text-ink whitespace-nowrap">{stat.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {/* Right visual */}
                        <motion.div
                            variants={flipVariants}
                            className="relative perspective-1000 hidden lg:block"
                        >
                            <div className="relative max-w-md mx-auto lg:max-w-none">
                                {/* Main card with flip effect */}
                                <motion.div
                                    whileHover={{
                                        rotateY: 5,
                                        rotateX: -5,
                                        transition: { duration: 0.3 }
                                    }}
                                    className="relative bg-neutral-900 rounded-2xl p-6 sm:p-8 pb-10 sm:pb-12 shadow-intense preserve-3d"
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <div className="space-y-4 sm:space-y-6">
                                        <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-accent/10 rounded-full">
                                            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                            <span className="text-xs sm:text-body-sm font-medium text-paper">Strategy-led creativity</span>
                                        </div>

                                        <h3 className="text-base sm:text-lg md:text-heading-lg font-bold text-paper">
                                            Smart ideas.{' '}
                                            <span className="text-accent">Bold impact.</span>{' '}
                                            Real growth.
                                        </h3>

                                        <div className="space-y-2 sm:space-y-3">
                                            {[
                                                'Performance Marketing',
                                                'Brand & Design',
                                                'Content & Social',
                                                'Marketing Automation'
                                            ].map((service, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                                                    className="flex items-center space-x-2 sm:space-x-3 group"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-5 sm:h-5 flex-shrink-0">
                                                        <path d="M5 10L8.5 13.5L15 7" stroke="#C20114" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <span className="text-xs sm:text-sm md:text-body text-paper/70 group-hover:text-paper transition-colors">
                                                        {service}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Decorative corner accent */}
                                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-accent/10 rounded-bl-full" />
                                </motion.div>

                                {/* Floating accent cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 1.5 }}
                                    className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 bg-accent text-ink px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-lift"
                                >
                                    <div className="text-base sm:text-lg md:text-heading-lg font-bold text-ink">210%</div>
                                    <div className="text-xs sm:text-sm md:text-body-sm text-ink">Avg. ROAS</div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 1.7 }}
                                    className="hidden sm:block absolute -bottom-4 -left-4 bg-neutral-900 px-4 py-2 rounded-xl shadow-lift border border-neutral-800"
                                >
                                    <div className="font-cursive text-lg md:text-xl text-accent">Creativity meets data</div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Animated Quotes Section - Below Border */}
            <div className="relative z-10 pb-6 md:pb-8">
                <div className="container-custom px-8 md:px-12 lg:px-16">
                    <div className="min-h-[80px] md:min-h-[100px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuote}
                                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                className="w-full"
                            >
                                <p className="font-display text-sm sm:text-base md:text-lg lg:text-l font-light text-ink/80 text-center max-w-4xl mx-auto italic px-4">
                                    &quot;{quotes[currentQuote]}&quot;
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Quote indicators */}
                    <div className="flex justify-center gap-2 mt-3">
                        {quotes.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentQuote(index)}
                                className={`h-2 rounded-full transition-all duration-300 ${index === currentQuote
                                    ? 'bg-accent w-8'
                                    : 'bg-ink/30 hover:bg-ink/50 w-2'
                                    }`}
                                aria-label={`Go to quote ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
