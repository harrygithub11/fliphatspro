'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { X, Play, TrendingUp, Target, Zap } from 'lucide-react'

interface CaseStudy {
    client: string
    sector: string
    challenge: string
    result: string
    period: string
    image: string
    gradient: string
    tagline?: string
    painPoints?: string[]
    strategy?: { title: string; description: string; icon: string }[]
    metrics?: { roas: string; conversion: string }
    detailedResults?: { label: string; value: string; change: string }[]
    testimonial?: { quote: string; author: string; role: string }
    media?: { type: string; src: string; caption: string; thumbnail?: string }[]
}

interface CaseStudyDetailProps {
    study: CaseStudy
    onClose: () => void
}

const CaseStudyDetail = ({ study, onClose }: CaseStudyDetailProps) => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    })

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

    if (!study) return null

    const metrics = [
        { icon: TrendingUp, label: 'ROAS Increase', value: study.metrics?.roas || '210%', color: 'text-accent' },
        { icon: Target, label: 'Conversion Rate', value: study.metrics?.conversion || '+45%', color: 'text-accent' },
        { icon: Zap, label: 'Time to Result', value: study.period || '45 days', color: 'text-ink' }
    ]

    const mediaGallery = study.media || [
        { type: 'image', src: '/website/images/case-study-1.jpg', caption: 'Campaign creative' },
        { type: 'video', src: '/videos/case-study-video.mp4', thumbnail: '/website/images/video-thumb.jpg', caption: 'Campaign showcase' },
        { type: 'image', src: '/website/images/case-study-2.jpg', caption: 'Results dashboard' }
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-paper overflow-y-auto"
        >
            {/* Close button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={onClose}
                className="fixed top-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-neutral-900 hover:bg-accent text-ink rounded-full shadow-lift transition-all duration-300"
                aria-label="Close case study"
            >
                <X size={24} />
            </motion.button>

            {/* Hero Section */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${study.image})` }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${study.gradient} opacity-80`} />
                    <div className="absolute inset-0 bg-paper/60" />
                </div>

                <div className="container-custom relative z-10 text-center py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        <div className="inline-block px-4 py-2 bg-accent/20 backdrop-blur-md rounded-full text-body-sm text-ink font-medium mb-4 border border-accent/30">
                            {study.sector}
                        </div>
                        <h1 className="text-display-md lg:text-6xl font-bold text-ink mb-6">
                            {study.client}
                        </h1>
                        <p className="text-heading-lg text-ink/90 max-w-3xl mx-auto mb-8">
                            {study.tagline || `How we helped ${study.client} achieve ${study.result}`}
                        </p>

                        <div className="flex flex-wrap justify-center gap-8 mt-12">
                            {metrics.map((metric, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className={`text-4xl lg:text-5xl font-bold ${metric.color} mb-2`}>
                                        {metric.value}
                                    </div>
                                    <div className="text-body-sm text-ink/70 uppercase tracking-wide">
                                        {metric.label}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 text-ink/60"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </motion.div>
            </section>

            {/* Overview Section */}
            <section className="section-padding bg-paper">
                <div className="container-custom max-w-5xl">
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8 }}
                        className="grid lg:grid-cols-2 gap-12 items-center"
                    >
                        <div>
                            <h2 className="text-display-sm font-bold text-ink mb-4">
                                The <span className="inline-block bg-accent text-ink px-3 py-1">Challenge</span>
                            </h2>
                            <p className="text-body text-ink/80 leading-relaxed mb-6">
                                {study.challenge}
                            </p>
                            <div className="space-y-3">
                                {(study.painPoints || [
                                    'High customer acquisition costs',
                                    'Low conversion rates on paid campaigns',
                                    'Unclear brand positioning in competitive market'
                                ]).map((point, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={inView ? { opacity: 1, x: 0 } : {}}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                        className="flex items-start space-x-3"
                                    >
                                        <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                                        <span className="text-body text-ink/70">{point}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={inView ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative rounded-2xl overflow-hidden shadow-intense bg-neutral-900 aspect-[4/3]"
                        >
                            <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-3 border-2 border-ink/20 rounded-lg flex items-center justify-center">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                    <p className="text-body-sm">Challenge visualization</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Strategy Section */}
            <section className="section-padding bg-neutral-900/30">
                <div className="container-custom max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-display-sm font-bold text-ink mb-4">
                            Our <span className="inline-block bg-accent text-ink px-3 py-1">Strategy</span>
                        </h2>
                        <p className="text-body text-ink/80 max-w-3xl mx-auto">
                            A data-driven approach combining creative storytelling with performance optimization
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {(study.strategy || [
                            { title: 'Audience Research', description: 'Deep-dive into customer behavior and preferences', icon: '🎯' },
                            { title: 'Creative Development', description: 'Compelling messaging that resonates with the target audience', icon: '🎨' },
                            { title: 'Performance Optimization', description: 'Continuous A/B testing and campaign refinement', icon: '⚡' }
                        ]).map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.15 }}
                                className="bg-neutral-900 rounded-xl p-6 hover:shadow-lift transition-all duration-300"
                            >
                                <div className="text-4xl mb-4">{step.icon}</div>
                                <h3 className="text-heading-md font-bold text-paper mb-2">{step.title}</h3>
                                <p className="text-body-sm text-paper/70">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Execution / Media Gallery Section */}
            <section className="section-padding bg-paper">
                <div className="container-custom max-w-6xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-display-sm font-bold text-ink mb-4">
                            Campaign <span className="inline-block bg-accent text-ink px-3 py-1">Execution</span>
                        </h2>
                        <p className="text-body text-ink/80 max-w-3xl mx-auto">
                            See how we brought the strategy to life
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative rounded-2xl overflow-hidden shadow-intense bg-neutral-900 aspect-video mb-6"
                    >
                        {mediaGallery[currentMediaIndex]?.type === 'video' ? (
                            <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center hover:bg-accent/30 transition-colors cursor-pointer">
                                        <Play size={32} className="text-accent ml-1" />
                                    </div>
                                    <p className="text-body">Video showcase placeholder</p>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 border-2 border-ink/20 rounded-lg flex items-center justify-center">
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    </div>
                                    <p className="text-body">{mediaGallery[currentMediaIndex]?.caption}</p>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    <div className="grid grid-cols-3 gap-4">
                        {mediaGallery.map((media, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                onClick={() => setCurrentMediaIndex(index)}
                                className={`relative rounded-lg overflow-hidden cursor-pointer aspect-video bg-neutral-900 border-2 transition-all duration-300 ${currentMediaIndex === index ? 'border-accent' : 'border-transparent hover:border-ink/30'
                                    }`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center text-ink/30">
                                    {media.type === 'video' ? (
                                        <Play size={24} className="text-accent" />
                                    ) : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <circle cx="8.5" cy="8.5" r="1.5" />
                                            <polyline points="21 15 16 10 5 21" />
                                        </svg>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section className="section-padding bg-accent">
                <div className="container-custom max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-display-sm font-bold text-ink mb-4">
                            The Results
                        </h2>
                        <p className="text-heading-lg text-ink/90 font-medium">
                            {study.result} in just {study.period}
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(study.detailedResults || [
                            { label: 'Revenue Growth', value: '3x', change: '+200%' },
                            { label: 'ROAS', value: '210%', change: '+110%' },
                            { label: 'Conversion Rate', value: '8.5%', change: '+45%' },
                            { label: 'Cost per Acquisition', value: '-40%', change: 'Reduced' }
                        ]).map((result, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-paper/10 backdrop-blur-md rounded-xl p-6 text-center border border-ink/10"
                            >
                                <div className="text-display-sm font-bold text-ink mb-2">{result.value}</div>
                                <div className="text-body-sm text-ink/80 mb-1">{result.label}</div>
                                <div className="text-body-sm text-ink/60">{result.change}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonial Section */}
            <section className="section-padding bg-paper">
                <div className="container-custom max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-neutral-900 rounded-2xl p-8 lg:p-12 shadow-intense relative"
                    >
                        <div className="absolute top-6 left-6 text-accent/20">
                            <svg width="48" height="36" viewBox="0 0 60 48" fill="currentColor">
                                <path d="M0 24C0 10.7452 10.7452 0 24 0V12C17.3726 12 12 17.3726 12 24C12 30.6274 17.3726 36 24 36V48C10.7452 48 0 37.2548 0 24Z" />
                                <path d="M36 24C36 10.7452 46.7452 0 60 0V12C53.3726 12 48 17.3726 48 24C48 30.6274 53.3726 36 60 36V48C46.7452 48 36 37.2548 36 24Z" />
                            </svg>
                        </div>

                        <blockquote className="relative z-10">
                            <p className="text-heading-lg font-medium text-paper leading-relaxed mb-6">
                                &quot;{study.testimonial?.quote || 'Fliphats transformed our marketing approach. Their strategic insights and execution delivered results beyond our expectations.'}&quot;
                            </p>
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center text-ink font-display font-bold text-body">
                                    {(study.testimonial?.author || study.client).charAt(0)}
                                </div>
                                <div>
                                    <div className="text-body font-bold text-paper">
                                        {study.testimonial?.author || 'Client Name'}
                                    </div>
                                    <div className="text-body-sm text-paper/60">
                                        {study.testimonial?.role || 'Marketing Director'} at {study.client}
                                    </div>
                                </div>
                            </div>
                        </blockquote>
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="section-padding bg-paper border-t border-neutral-800">
                <div className="container-custom max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-display-sm font-bold text-ink mb-4">
                            Ready for similar results?
                        </h2>
                        <p className="text-body text-ink/80 mb-8 max-w-2xl mx-auto">
                            Let&apos;s discuss how we can help your brand achieve breakthrough growth
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <button className="btn-primary">
                                Start a Conversation
                            </button>
                            <button onClick={onClose} className="btn-secondary">
                                Back to Case Studies
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </motion.div>
    )
}

export default CaseStudyDetail
