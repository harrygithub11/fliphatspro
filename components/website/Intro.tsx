'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const Intro = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.2
    })

    const [activeSlide, setActiveSlide] = useState(0)

    const images = [
        '/website/images/whoweare01.jpg',
        '/website/images/whoweare02.jpg',
        '/website/images/whoweare03.jpg',
        '/website/images/whoweare04.jpg'
    ]

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide((current) => (current + 1) % images.length)
        }, 4000)
        return () => clearInterval(interval)
    }, [images.length])

    return (
        <section className="section-padding bg-paper relative overflow-hidden">
            {/* Background Image Slider */}
            <div className="absolute inset-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSlide}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0"
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${images[activeSlide]})`,
                                filter: 'grayscale(20%) brightness(0.9)'
                            }}
                        />
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-paper/95 via-paper/85 to-paper/75" />
                    </motion.div>
                </AnimatePresence>

                {/* Slide indicators */}
                <div className="absolute bottom-6 right-6 z-10 flex space-x-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto ${index === activeSlide
                                ? 'bg-accent w-6'
                                : 'bg-ink/30 hover:bg-ink/50'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="container-custom relative z-10"
            >
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
                        <div className="space-y-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                            >
                                <h2 className="text-display-sm lg:text-display-md font-bold text-ink text-balance">
                                    Who <span className="inline-block bg-accent text-ink px-3 py-1">We Are</span>
                                </h2>
                            </motion.div>

                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="text-body text-ink leading-relaxed"
                            >
                                Fliphats is a creative and performance marketing agency built to redefine how brands connect, communicate, and grow.
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="text-body text-ink leading-relaxed"
                            >
                                We merge creative storytelling with data-driven strategy helping brands not just stand out, but stay ahead.
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                            className="relative"
                        >
                            <div className="bg-neutral-900 rounded-2xl p-6 lg:p-8 shadow-lift">
                                <h3 className="text-heading-md font-bold text-accent mb-3">Our Approach</h3>
                                <p className="text-heading-lg font-bold text-paper mb-3">
                                    Smart ideas. Bold impact. Real growth.
                                </p>
                                <p className="text-body-sm text-paper/70">
                                    We don&apos;t just follow trends we create movements that matter.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}

export default Intro
