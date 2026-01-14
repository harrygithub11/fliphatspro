'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const FinalCTA = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.3
    })

    return (
        <section className="section-padding bg-accent relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="cta-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                            <circle cx="30" cy="30" r="1.5" fill="white" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cta-pattern)" />
                </svg>
            </div>

            {/* Floating decorative shapes */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 1.2 }}
                className="absolute top-10 right-10 w-64 h-64 bg-paper rounded-full blur-3xl"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.2 }}
                className="absolute bottom-10 left-10 w-48 h-48 bg-paper rounded-full blur-3xl"
            />

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8 }}
                className="container-custom relative z-10"
            >
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-4">
                            Ready to <span className="inline-block bg-paper text-ink px-3 py-1">grow smarter?</span>
                        </h2>
                        <p className="text-heading-lg text-ink/90 font-medium mb-2">
                            Let&apos;s <span className="inline-block bg-paper text-ink px-2 py-1">flip</span> your brand&apos;s next big chapter.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center px-8 py-3.5 text-body font-display font-medium bg-paper text-ink rounded-lg shadow-lift hover:shadow-intense transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-paper focus:ring-offset-2 focus:ring-offset-accent"
                        >
                            Start a Conversation
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="inline-flex items-center justify-center px-8 py-3.5 text-body font-display font-medium bg-transparent text-ink border-2 border-ink rounded-lg hover:bg-paper hover:text-ink transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-paper focus:ring-offset-2 focus:ring-offset-accent"
                        >
                            View Our Process
                        </motion.button>
                    </motion.div>

                    {/* Contact info */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={inView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-wrap justify-center gap-8 pt-8 text-ink"
                    >
                        <a
                            href="mailto:hello@fliphats.com"
                            className="flex items-center space-x-2 hover:opacity-90 transition-colors duration-300 group"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 4H17C17.55 4 18 4.45 18 5V15C18 15.55 17.55 16 17 16H3C2.45 16 2 15.55 2 15V5C2 4.45 2.45 4 3 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M18 5L10 11L2 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="group-hover:underline">hello@fliphats.com</span>
                        </a>

                        <a
                            href="tel:+917600047765"
                            className="flex items-center space-x-2 hover:opacity-90 transition-colors duration-300 group"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="group-hover:underline">+91 7600047765</span>
                        </a>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}

export default FinalCTA
