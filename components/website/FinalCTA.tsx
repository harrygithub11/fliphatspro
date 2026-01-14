'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'

const FinalCTA = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.3
    })

    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        services: [] as string[],
        budget: '',
        description: ''
    })

    const servicesList = [
        "Brand Identity", "Web Development", "App Development",
        "Digital Marketing", "SEO / Content", "Custom Software"
    ]

    const budgetRanges = [
        "Undecided", "$1k - $5k", "$5k - $10k", "$10k - $25k", "$25k+"
    ]

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const toggleService = (service: string) => {
        setFormData(prev => {
            const exists = prev.services.includes(service)
            return {
                ...prev,
                services: exists
                    ? prev.services.filter(s => s !== service)
                    : [...prev.services, service]
            }
        })
    }

    const handleNext = () => {
        if (!formData.name || !formData.email) {
            alert("Please fill in your name and email to proceed.")
            return
        }
        setStep(2)
    }

    const handleBack = () => {
        setStep(1)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                setIsSuccess(true)
            } else {
                alert("Something went wrong. Please try again.")
            }
        } catch (error) {
            console.error(error)
            alert("Network error. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="contact" className="section-padding bg-accent relative overflow-hidden min-h-[800px] flex items-center">
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
                className="container-custom relative z-10 w-full"
            >
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Side: Text */}
                    <div className="space-y-6 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-4">
                                Ready to <span className="inline-block bg-paper text-ink px-3 py-1">grow smarter?</span>
                            </h2>
                            <p className="text-heading-lg text-ink/90 font-medium mb-6">
                                Let&apos;s <span className="inline-block bg-paper text-ink px-2 py-1">flip</span> your brand&apos;s next big chapter.
                            </p>
                            <p className="text-body text-ink/80 max-w-lg mx-auto lg:mx-0">
                                Whether you have a clear vision or just a rough idea, we&apos;re here to help you turn it into reality. Fill out the form to get started.
                            </p>
                        </motion.div>

                        {/* Contact info Desktop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={inView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="hidden lg:flex flex-col gap-4 pt-4 text-ink"
                        >
                            <a href="mailto:hello@fliphats.com" className="flex items-center space-x-3 hover:opacity-80 transition-colors duration-300">
                                <div className="w-10 h-10 rounded-full bg-paper text-accent flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4H17C17.55 4 18 4.45 18 5V15C18 15.55 17.55 16 17 16H3C2.45 16 2 15.55 2 15V5C2 4.45 2.45 4 3 4Z" /><path d="M18 5L10 11L2 5" /></svg>
                                </div>
                                <span className="text-lg font-medium">hello@fliphats.com</span>
                            </a>
                            <a href="tel:+917600047765" className="flex items-center space-x-3 hover:opacity-80 transition-colors duration-300">
                                <div className="w-10 h-10 rounded-full bg-paper text-accent flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" /></svg>
                                </div>
                                <span className="text-lg font-medium">+91 7600047765</span>
                            </a>
                        </motion.div>
                    </div>

                    {/* Right Side: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="bg-paper text-ink rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
                            {isSuccess ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-paper z-20">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold mb-3">Message Received!</h3>
                                    <p className="text-ink/70 max-w-xs mx-auto">
                                        Thanks for reaching out! We&apos;ll review your project details and get back to you shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                                    {/* Progress Bar */}
                                    <div className="h-1.5 bg-neutral-100 w-full">
                                        <motion.div
                                            className="h-full bg-accent"
                                            initial={{ width: "50%" }}
                                            animate={{ width: step === 1 ? "50%" : "100%" }}
                                        />
                                    </div>

                                    <div className="p-8 flex-1 flex flex-col justify-center">
                                        <AnimatePresence mode='wait'>
                                            {step === 1 ? (
                                                <motion.div
                                                    key="step1"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="mb-6">
                                                        <h3 className="text-xl font-bold">About You</h3>
                                                        <p className="text-sm text-ink/60">Let&apos;s start with the basics.</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <input
                                                            name="name" placeholder="Full Name *"
                                                            value={formData.name} onChange={handleInputChange}
                                                            className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                                        />
                                                        <input
                                                            name="phone" placeholder="Phone Number"
                                                            value={formData.phone} onChange={handleInputChange}
                                                            className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                                        />
                                                    </div>
                                                    <input
                                                        name="email" type="email" placeholder="Work Email *"
                                                        value={formData.email} onChange={handleInputChange}
                                                        className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                                    />
                                                    <input
                                                        name="company" placeholder="Company Name"
                                                        value={formData.company} onChange={handleInputChange}
                                                        className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                                                    />

                                                    <div className="pt-4 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleNext}
                                                            className="inline-flex items-center btn-primary px-6 py-3"
                                                        >
                                                            Next Step <ArrowRight className="w-4 h-4 ml-2" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="step2"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="space-y-4"
                                                >
                                                    <div className="mb-4">
                                                        <button type="button" onClick={handleBack} className="text-sm text-ink/50 hover:text-accent flex items-center mb-2"><ArrowLeft className="w-3 h-3 mr-1" /> Back</button>
                                                        <h3 className="text-xl font-bold">Project Details</h3>
                                                        <p className="text-sm text-ink/60">Tell us what you&apos;re building.</p>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-ink/50 mb-2 block tracking-wider">I&apos;m interested in...</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {servicesList.map(s => (
                                                                <button
                                                                    key={s} type="button"
                                                                    onClick={() => toggleService(s)}
                                                                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${formData.services.includes(s)
                                                                            ? 'bg-accent text-ink border-accent'
                                                                            : 'bg-transparent text-ink/60 border-neutral-200 hover:border-accent/50'
                                                                        }`}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <select
                                                        name="budget"
                                                        value={formData.budget} onChange={handleInputChange}
                                                        className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm"
                                                    >
                                                        <option value="" disabled>Estimated Budget</option>
                                                        {budgetRanges.map(b => (
                                                            <option key={b} value={b}>{b}</option>
                                                        ))}
                                                    </select>

                                                    <textarea
                                                        name="description" placeholder="Project Description (Optional)"
                                                        rows={3}
                                                        value={formData.description} onChange={handleInputChange}
                                                        className="w-full bg-neutral-50 px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all text-sm resize-none"
                                                    />

                                                    <div className="pt-2">
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="w-full inline-flex items-center justify-center btn-primary px-6 py-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                                        >
                                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Inquiry'}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>

                </div>
            </motion.div>
        </section>
    )
}

export default FinalCTA
