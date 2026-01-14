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
                const data = await res.json().catch(() => ({}));
                alert(`Error: ${data.message || data.error || "Something went wrong. Please try again."}`)
            }
        } catch (error) {
            console.error(error)
            alert("Network error. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section id="contact" className="section-padding bg-black relative overflow-hidden min-h-[900px] flex items-center">
            {/* Background pattern - Red Dots */}
            <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="cta-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="#DC2626" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#cta-pattern)" />
                </svg>
            </div>

            {/* Ambient Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8 }}
                className="container-custom relative z-10 w-full"
            >
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">

                    {/* Left Side: Text */}
                    <div className="space-y-8 text-center lg:text-left relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
                                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">grow smarter?</span>
                            </h2>
                            <p className="text-2xl text-zinc-400 font-light mb-8 max-w-xl mx-auto lg:mx-0">
                                Let&apos;s <span className="text-white font-medium">flip</span> your brand&apos;s next big chapter.
                            </p>
                            <p className="text-lg text-zinc-500 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                                Whether you have a clear vision or just a rough idea, we&apos;re here to help you turn it into reality.
                            </p>
                        </motion.div>

                        {/* Contact info Desktop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={inView ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="hidden lg:flex flex-col gap-6 pt-4 text-zinc-300"
                        >
                            <a href="mailto:contact@fliphats.com" className="flex items-center space-x-4 group">
                                <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 transition-all duration-300">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4H17C17.55 4 18 4.45 18 5V15C18 15.55 17.55 16 17 16H3C2.45 16 2 15.55 2 15V5C2 4.45 2.45 4 3 4Z" /><path d="M18 5L10 11L2 5" /></svg>
                                </div>
                                <span className="text-lg font-medium group-hover:text-white transition-colors">contact@fliphats.com</span>
                            </a>
                            <a href="tel:+919602003790" className="flex items-center space-x-4 group">
                                <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 transition-all duration-300">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" /></svg>
                                </div>
                                <span className="text-lg font-medium group-hover:text-white transition-colors">+91 9602003790</span>
                            </a>
                            <a href="tel:+917600047765" className="flex items-center space-x-4 group">
                                <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 transition-all duration-300">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" /></svg>
                                </div>
                                <span className="text-lg font-medium group-hover:text-white transition-colors">+91 7600047765</span>
                            </a>
                        </motion.div>
                    </div>

                    {/* Right Side: Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {/* Premium Card Container */}
                        <div className="bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 text-white rounded-[2rem] shadow-2xl overflow-hidden min-h-[550px] flex flex-col relative group hover:border-zinc-700 transition-colors duration-500">

                            {/* Card Glow Effect */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 rounded-full blur-3xl group-hover:bg-red-600/20 transition-all duration-700" />

                            {isSuccess ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 bg-zinc-950 z-20">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-8 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                        <CheckCircle2 className="w-12 h-12" />
                                    </motion.div>
                                    <h3 className="text-3xl font-bold mb-4 text-white">Message Received!</h3>
                                    <p className="text-zinc-400 max-w-sm mx-auto text-lg">
                                        Thanks for reaching out! We&apos;ll review your project details and get back to you shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex flex-col h-full relative z-10">
                                    {/* Premium Progress Bar */}
                                    <div className="h-1 bg-zinc-900 w-full">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-red-600 to-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                                            initial={{ width: "50%" }}
                                            animate={{ width: step === 1 ? "50%" : "100%" }}
                                        />
                                    </div>

                                    <div className="p-8 lg:p-10 flex-1 flex flex-col justify-center">
                                        <AnimatePresence mode='wait'>
                                            {step === 1 ? (
                                                <motion.div
                                                    key="step1"
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="mb-8">
                                                        <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">About You</h3>
                                                        <p className="text-zinc-500">Let&apos;s start with the basics.</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-5">
                                                        <div className="space-y-2">
                                                            <input
                                                                name="name" placeholder="Full Name *"
                                                                value={formData.name} onChange={handleInputChange}
                                                                className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <input
                                                                name="phone" placeholder="Phone Number"
                                                                value={formData.phone} onChange={handleInputChange}
                                                                className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <input
                                                            name="email" type="email" placeholder="Work Email *"
                                                            value={formData.email} onChange={handleInputChange}
                                                            className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <input
                                                            name="company" placeholder="Company Name"
                                                            value={formData.company} onChange={handleInputChange}
                                                            className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600"
                                                        />
                                                    </div>

                                                    <div className="pt-6 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={handleNext}
                                                            className="inline-flex items-center bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-medium transition-all shadow-[0_4px_20px_rgba(220,38,38,0.25)] hover:shadow-[0_8px_30px_rgba(220,38,38,0.35)] hover:-translate-y-0.5"
                                                        >
                                                            Next Step <ArrowRight className="w-5 h-5 ml-2" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="step2"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="mb-6">
                                                        <button type="button" onClick={handleBack} className="text-sm text-zinc-500 hover:text-white flex items-center mb-4 transition-colors"><ArrowLeft className="w-4 h-4 mr-1" /> Back to basics</button>
                                                        <h3 className="text-3xl font-bold text-white mb-2 tracking-tight">Project Details</h3>
                                                        <p className="text-zinc-500">Tell us what you&apos;re building.</p>
                                                    </div>

                                                    <div>
                                                        <label className="text-xs font-bold uppercase text-zinc-600 mb-3 block tracking-widest">I&apos;m interested in...</label>
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {servicesList.map(s => (
                                                                <button
                                                                    key={s} type="button"
                                                                    onClick={() => toggleService(s)}
                                                                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-300 ${formData.services.includes(s)
                                                                        ? 'bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                                                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white'
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
                                                        className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white text-sm"
                                                    >
                                                        <option value="" disabled className="text-zinc-500">Estimated Budget</option>
                                                        {budgetRanges.map(b => (
                                                            <option key={b} value={b} className="bg-zinc-900 text-white">{b}</option>
                                                        ))}
                                                    </select>

                                                    <textarea
                                                        name="description" placeholder="Project Description (Optional)"
                                                        rows={3}
                                                        value={formData.description} onChange={handleInputChange}
                                                        className="w-full bg-zinc-900/50 px-5 py-4 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20 focus:bg-zinc-900 transition-all text-white placeholder:text-zinc-600 text-sm resize-none"
                                                    />

                                                    <div className="pt-4">
                                                        <button
                                                            type="submit"
                                                            disabled={isSubmitting}
                                                            className="w-full inline-flex items-center justify-center bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
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
