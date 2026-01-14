'use client'

import { motion, Variants } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { ReactNode } from 'react'

interface Service {
    title: string
    description: string
    icon: ReactNode
}

const Services = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    })

    const services: Service[] = [
        {
            title: 'Performance Marketing',
            description: 'Data-driven campaigns that deliver measurable growth.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="4" y="28" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                    <rect x="16" y="20" width="8" height="24" rx="2" stroke="currentColor" strokeWidth="2" />
                    <rect x="28" y="12" width="8" height="32" rx="2" stroke="currentColor" strokeWidth="2" />
                    <path d="M40 8L44 12L40 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M36 12H44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        },
        {
            title: 'Brand & Design',
            description: 'Build a brand identity that connects and converts.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 40L24 8L40 40H8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M24 18V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        },
        {
            title: 'Content & Social',
            description: 'Engaging stories that drive awareness and loyalty.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="32" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 20H40" stroke="currentColor" strokeWidth="2" />
                    <circle cx="16" cy="28" r="2" fill="currentColor" />
                    <circle cx="24" cy="28" r="2" fill="currentColor" />
                    <circle cx="32" cy="28" r="2" fill="currentColor" />
                </svg>
            )
        },
        {
            title: 'Marketing Automation',
            description: 'Smarter workflows, deeper personalization.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="24" r="4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="36" cy="24" r="4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="24" cy="36" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M15.5 22L21 14" stroke="currentColor" strokeWidth="2" />
                    <path d="M27 14L32.5 22" stroke="currentColor" strokeWidth="2" />
                    <path d="M15.5 26L21 34" stroke="currentColor" strokeWidth="2" />
                    <path d="M27 34L32.5 26" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        },
        {
            title: 'CRM-Integrated Web Apps',
            description: 'Custom web apps connected to your CRM for leads, automation, and real-time analytics.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M30 14C28.2 10.5 24.47 8 20.2 8C14.57 8 10 12.48 10 18C10 18.34 10.02 18.68 10.06 19H10C7.24 19 5 21.24 5 24C5 26.76 7.24 29 10 29H31C34.31 29 37 26.31 37 23C37 19.91 34.73 17.35 31.76 17.05C31.22 15.17 30 14 30 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="16" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
                    <circle cx="32" cy="34" r="4" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 34H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <rect x="18" y="20" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
                </svg>
            )
        },
        {
            title: 'Web & Digital Strategy',
            description: 'Websites that work as hard as your campaigns.',
            icon: (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="10" width="36" height="28" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M6 18H42" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="14" r="1.5" fill="currentColor" />
                    <circle cx="17" cy="14" r="1.5" fill="currentColor" />
                    <circle cx="22" cy="14" r="1.5" fill="currentColor" />
                    <path d="M12 24H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 30H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            )
        }
    ]

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    }

    return (
        <section id="services" className="section-padding bg-paper">
            <div className="container-custom">
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-3">
                        What <span className="inline-block bg-accent text-ink px-3 py-1">We Do</span>
                    </h2>
                    <p className="text-body text-ink max-w-3xl mx-auto">
                        From strategy to storytelling everything your brand needs to grow under one creative roof.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                >
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={{
                                y: -8,
                                transition: { duration: 0.3 }
                            }}
                            className="group relative bg-neutral-900 rounded-xl p-6 shadow-soft hover:shadow-lift transition-all duration-300 cursor-pointer perspective-1000 flex flex-col min-h-[260px] lg:min-h-[280px]"
                        >
                            {/* Icon */}
                            <motion.div
                                className="inline-flex items-center justify-center w-12 h-12 mb-4 text-accent"
                                whileHover={{
                                    scale: 1.1,
                                    rotate: 5,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                {service.icon}
                            </motion.div>

                            {/* Content */}
                            <h3 className="text-heading-md font-bold text-paper mb-2 group-hover:text-accent transition-colors duration-300">
                                {service.title}
                            </h3>
                            <p className="text-body-sm text-paper/60 mb-4">
                                {service.description}
                            </p>

                            {/* Arrow link */}
                            <div className="flex items-center text-accent font-medium group mt-auto">
                                <span className="mr-2">Learn more</span>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="transform group-hover:translate-x-1 transition-transform duration-300"
                                >
                                    <path
                                        d="M4 10H16M16 10L12 6M16 10L12 14"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>

                            {/* Decorative corner */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-center mt-10"
                >
                    <button className="btn-primary">
                        See All Services
                    </button>
                </motion.div>
            </div>
        </section>
    )
}

export default Services
