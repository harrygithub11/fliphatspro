'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const CoreBelief = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.3
    })

    return (
        <section className="section-padding bg-paper relative overflow-hidden">
            {/* Decorative line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-ink to-transparent" />

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8 }}
                className="container-custom"
            >
                <div className="max-w-4xl mx-auto text-center space-y-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-4">
                            Our <span className="inline-block bg-accent text-ink px-3 py-1">Core Belief</span>
                        </h2>
                        <div className="relative inline-block">
                            <p className="text-heading-lg lg:text-display-sm font-bold text-ink text-balance">
                                Marketing isn&apos;t about{' '}
                                <span className="text-ink/40 line-through">shouting louder</span>
                                {' '}it&apos;s about{' '}
                                <span className="inline-block bg-accent text-ink px-3 py-1">
                                    speaking smarter
                                </span>
                            </p>
                        </div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-body text-ink max-w-3xl mx-auto"
                    >
                        We focus on clarity, creativity, and connection so your brand&apos;s message cuts through the noise and makes a lasting impression.
                    </motion.p>

                    {/* Visual accent */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex justify-center items-center space-x-3 pt-8"
                    >
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-ink to-transparent" />
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-ink">
                            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" fill="currentColor" />
                        </svg>
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-ink to-transparent" />
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}

export default CoreBelief
