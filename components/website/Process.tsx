'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const Process = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2
    })

    const steps = [
        {
            number: '01',
            title: 'Discover',
            description: 'We deep to understand your brand and audience.',
            details: 'Market research, competitor analysis, audience insights'
        },
        {
            number: '02',
            title: 'Strategize',
            description: 'We design campaigns grounded in insights.',
            details: 'Brand positioning, campaign strategy, content planning'
        },
        {
            number: '03',
            title: 'Execute',
            description: 'We create, optimize, and scale for results.',
            details: 'Creative production, campaign launch, performance optimization'
        }
    ]

    return (
        <section className="section-padding bg-paper relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.02]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="20" cy="20" r="2" fill="currentColor" className="text-ink" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
            </div>

            <div className="container-custom relative z-10">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-3">
                        How <span className="inline-block bg-accent text-ink px-3 py-1">We Work</span>
                    </h2>
                    <p className="text-body text-ink max-w-2xl mx-auto">
                        Strategy-led. Data-backed. Creatively executed.
                    </p>
                </motion.div>

                <div className="max-w-6xl mx-auto">
                    {/* Timeline base line for desktop */}
                    <div className="relative hidden lg:block mb-8">
                        <div className="absolute left-0 right-0 top-8 h-[2px] bg-gradient-to-r from-accent/30 via-accent/20 to-accent/10 rounded-full" />
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8 lg:gap-6 items-start">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                                transition={{ duration: 0.8, delay: index * 0.2 }}
                                className="relative"
                            >
                                {/* Connector line (not on last item) */}
                                {index < steps.length - 1 && (
                                    <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 + index * 0.2 }}
                                        className="hidden lg:block absolute top-16 left-[62%] w-full h-[2px] bg-gradient-to-r from-accent/40 to-accent/10 origin-left rounded-full"
                                    />
                                )}

                                <div className="relative bg-neutral-900 rounded-xl p-6 shadow-soft hover:shadow-lift transition-all duration-300 group cursor-pointer min-h-[240px] flex flex-col">
                                    {/* Step number badge */}
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-accent text-ink rounded-xl font-display font-bold text-heading-md shadow-soft relative z-10"
                                    >
                                        {step.number}
                                    </motion.div>

                                    {/* Timeline node for desktop */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={inView ? { scale: 1 } : { scale: 0 }}
                                        transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                                        className="hidden lg:block absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent shadow-soft"
                                    />

                                    <h3 className="text-heading-lg font-bold text-paper mb-2 group-hover:text-accent transition-colors duration-300">
                                        {step.title}
                                    </h3>

                                    <p className="text-body-sm text-paper/60 mb-3">
                                        {step.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-neutral-700">
                                        <p className="text-body-sm text-paper/50 italic">
                                            {step.details}
                                        </p>
                                    </div>

                                    {/* Hover indicator */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileHover={{ width: '100%' }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute bottom-0 left-0 h-1 bg-accent rounded-b-2xl"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Bottom tagline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="text-center mt-12"
                >
                    <p className="font-cursive text-3xl text-accent">
                        From insights to impact
                    </p>
                </motion.div>
            </div>
        </section>
    )
}

export default Process
