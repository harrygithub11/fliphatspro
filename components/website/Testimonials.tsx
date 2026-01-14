'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

interface Testimonial {
    quote: string
    author: string
    role: string
    company: string
}

const Testimonials = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2
    })

    const [activeIndex, setActiveIndex] = useState(0)

    const testimonials: Testimonial[] = [
        {
            quote: "Fliphats helped us turn clicks into loyal customers. Their creativity and performance mindset made all the difference.",
            author: "Sarah Chen",
            role: "VP of Marketing",
            company: "Urban Threads"
        },
        {
            quote: "The team's strategic approach and data-driven execution tripled our revenue in just 90 days. Exceptional results.",
            author: "Michael Rodriguez",
            role: "CEO",
            company: "TechStart Co"
        },
        {
            quote: "Working with Fliphats transformed how we think about marketing. They're true partners in growth.",
            author: "Emma Thompson",
            role: "Founder",
            company: "Wellness Hub"
        }
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % testimonials.length)
        }, 6000)
        return () => clearInterval(interval)
    }, [testimonials.length])

    return (
        <section className="section-padding bg-paper relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-[0.03]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <pattern id="testimonial-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
                        <path d="M0 40L40 0L80 40L40 80L0 40Z" fill="currentColor" className="text-accent" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#testimonial-pattern)" />
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
                        What Our <span className="inline-block bg-accent text-ink px-3 py-1">Clients Say</span>
                    </h2>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative bg-neutral-900 rounded-2xl p-8 lg:p-10 shadow-intense"
                    >
                        {/* Quote icon */}
                        <div className="absolute top-6 left-6 text-accent/20">
                            <svg width="48" height="36" viewBox="0 0 60 48" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 24C0 10.7452 10.7452 0 24 0V12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36V48C10.7452 48 0 37.2548 0 24Z" />
                                <path d="M36 24C36 10.7452 46.7452 0 60 0V12C53.3726 12 48 17.3726 48 24C48 30.6274 53.3726 36 60 36V48C46.7452 48 36 37.2548 36 24Z" />
                            </svg>
                        </div>

                        {/* Testimonial content */}
                        <div className="relative min-h-[220px] flex items-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full"
                                >
                                    <blockquote className="mb-6">
                                        <p className="text-heading-lg font-medium text-paper leading-relaxed">
                                            &quot;{testimonials[activeIndex].quote}&quot;
                                        </p>
                                    </blockquote>

                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-ink font-display font-bold text-body">
                                            {testimonials[activeIndex].author.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-body font-bold text-paper">
                                                {testimonials[activeIndex].author}
                                            </div>
                                            <div className="text-body-sm text-paper/60">
                                                {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation dots */}
                        <div className="flex justify-center space-x-3 mt-8">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setActiveIndex(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${index === activeIndex
                                        ? 'bg-accent w-8'
                                        : 'bg-paper/30 hover:bg-paper/50'
                                        }`}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Decorative corner */}
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-accent/10 rounded-tl-full" />
                    </motion.div>

                    {/* Navigation arrows */}
                    <div className="flex justify-center space-x-4 mt-8">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveIndex((current) =>
                                current === 0 ? testimonials.length - 1 : current - 1
                            )}
                            className="w-12 h-12 flex items-center justify-center bg-paper rounded-full shadow-soft hover:shadow-lift transition-all duration-300 text-ink hover:text-accent"
                            aria-label="Previous testimonial"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setActiveIndex((current) => (current + 1) % testimonials.length)}
                            className="w-12 h-12 flex items-center justify-center bg-paper rounded-full shadow-soft hover:shadow-lift transition-all duration-300 text-ink hover:text-accent"
                            aria-label="Next testimonial"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonials
