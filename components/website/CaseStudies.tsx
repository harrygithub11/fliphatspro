'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import CaseStudyDetail from './CaseStudyDetail'

interface CaseStudy {
    client: string
    sector: string
    challenge: string
    result: string
    period: string
    image: string
    gradient: string
    tagline: string
    painPoints: string[]
    strategy: { title: string; description: string; icon: string }[]
    metrics: { roas: string; conversion: string }
    detailedResults: { label: string; value: string; change: string }[]
    testimonial: { quote: string; author: string; role: string }
}

const CaseStudies = () => {
    const [ref, inView] = useInView({
        triggerOnce: true,
        threshold: 0.1
    })

    const [selectedStudy, setSelectedStudy] = useState<CaseStudy | null>(null)

    const caseStudies: CaseStudy[] = [
        {
            client: 'Urban Threads',
            sector: 'E-commerce',
            challenge: 'Improve ROI from social ad spend',
            result: '210% increase in ROAS',
            period: '45 days',
            image: '/website/images/Urban-Threads.jpg',
            gradient: 'from-brand-600 to-brand-900',
            tagline: 'Transforming social ad spend into sustainable growth',
            painPoints: [
                'High customer acquisition costs',
                'Low conversion rates on paid social campaigns',
                'Unclear brand positioning in competitive market'
            ],
            strategy: [
                { title: 'Audience Segmentation', description: 'Deep-dive into customer personas and behavior patterns', icon: '🎯' },
                { title: 'Creative Testing', description: 'A/B testing across 50+ ad variations', icon: '🎨' },
                { title: 'Funnel Optimization', description: 'Landing page and checkout flow improvements', icon: '⚡' }
            ],
            metrics: { roas: '210%', conversion: '+45%' },
            detailedResults: [
                { label: 'Revenue Growth', value: '3.2x', change: '+220%' },
                { label: 'ROAS', value: '210%', change: '+110%' },
                { label: 'Conversion Rate', value: '8.5%', change: '+45%' },
                { label: 'Cost per Acquisition', value: '-35%', change: 'Reduced' }
            ],
            testimonial: {
                quote: 'Fliphats helped us turn clicks into loyal customers. Their creativity and performance mindset made all the difference.',
                author: 'Sarah Chen',
                role: 'VP of Marketing'
            }
        },
        {
            client: 'TechStart Co',
            sector: 'SaaS',
            challenge: 'Scale user acquisition efficiently',
            result: '3x revenue growth',
            period: '90 days',
            image: '/website/images/TechStart-Co.jpg',
            gradient: 'from-neutral-700 to-neutral-900',
            tagline: 'Scaling SaaS growth through data-driven acquisition',
            painPoints: [
                'Inefficient user acquisition funnel',
                'High churn rate in trial period',
                'Low product-market fit messaging'
            ],
            strategy: [
                { title: 'Funnel Analysis', description: 'Comprehensive audit of user journey and drop-off points', icon: '📊' },
                { title: 'Content Strategy', description: 'Educational content to nurture leads through the funnel', icon: '📝' },
                { title: 'Retention Tactics', description: 'Onboarding optimization and engagement campaigns', icon: '🔄' }
            ],
            metrics: { roas: '320%', conversion: '+65%' },
            detailedResults: [
                { label: 'Revenue Growth', value: '3x', change: '+200%' },
                { label: 'User Acquisition', value: '+150%', change: 'Increase' },
                { label: 'Trial to Paid', value: '42%', change: '+65%' },
                { label: 'Churn Rate', value: '-28%', change: 'Reduced' }
            ],
            testimonial: {
                quote: 'The strategic approach and data-driven execution tripled our revenue in just 90 days. Exceptional results.',
                author: 'Michael Rodriguez',
                role: 'CEO'
            }
        },
        {
            client: 'Wellness Hub',
            sector: 'Health & Fitness',
            challenge: 'Reduce customer acquisition cost',
            result: '40% cost reduction',
            period: '60 days',
            image: '/website/images/WellnessHub.jpg',
            gradient: 'from-accent to-brand-700',
            tagline: 'Making wellness accessible through smart marketing',
            painPoints: [
                'High CAC limiting growth potential',
                'Generic messaging not resonating with target audience',
                'Poor organic reach and brand awareness'
            ],
            strategy: [
                { title: 'Community Building', description: 'Organic social strategy and influencer partnerships', icon: '👥' },
                { title: 'Content Marketing', description: 'Educational blog and video content for SEO and engagement', icon: '📹' },
                { title: 'Retargeting', description: 'Smart remarketing to warm audiences', icon: '🎯' }
            ],
            metrics: { roas: '180%', conversion: '+38%' },
            detailedResults: [
                { label: 'CAC Reduction', value: '-40%', change: 'Reduced' },
                { label: 'Organic Traffic', value: '+120%', change: 'Increase' },
                { label: 'Engagement Rate', value: '12.5%', change: '+85%' },
                { label: 'Member Retention', value: '89%', change: '+22%' }
            ],
            testimonial: {
                quote: 'Working with Fliphats transformed how we think about marketing. They are true partners in growth.',
                author: 'Emma Thompson',
                role: 'Founder'
            }
        }
    ]

    return (
        <>
            <section id="work" className="section-padding bg-paper">
                <div className="container-custom">
                    <motion.div
                        ref={ref}
                        initial={{ opacity: 0, y: 30 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-12"
                    >
                        <h2 className="text-display-sm lg:text-display-md font-bold text-ink mb-3">
                            Our <span className="inline-block bg-accent text-ink px-3 py-1">Impact</span>
                        </h2>
                        <p className="text-body text-ink max-w-3xl mx-auto">
                            We turn ideas into action and strategy into success.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                        {caseStudies.map((study, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 40 }}
                                animate={inView ? {
                                    opacity: 1,
                                    y: [0, -8, 0],
                                    transition: {
                                        opacity: { duration: 0.6, delay: index * 0.15 },
                                        y: {
                                            duration: 3 + index * 0.5,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: index * 0.3
                                        }
                                    }
                                } : { opacity: 0, y: 40 }}
                                whileHover={{
                                    y: -12,
                                    transition: { duration: 0.3 }
                                }}
                                onClick={() => setSelectedStudy(study)}
                                className="group relative bg-neutral-900 rounded-2xl overflow-hidden shadow-soft hover:shadow-intense transition-shadow duration-500 cursor-pointer"
                            >
                                {/* Image Header with Motion */}
                                <div className="relative h-48 overflow-hidden">
                                    <motion.div
                                        className="absolute inset-0 bg-cover bg-center"
                                        style={{
                                            backgroundImage: `url(${study.image})`,
                                        }}
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    />

                                    {/* Gradient Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${study.gradient} opacity-60 group-hover:opacity-50 transition-opacity duration-500`} />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                                            transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                                        >
                                            <div className="inline-block px-3 py-1 bg-paper/25 backdrop-blur-md rounded-full text-body-sm text-ink font-medium mb-2 border border-paper/20">
                                                {study.sector}
                                            </div>
                                            <h3 className="text-heading-lg font-bold text-ink drop-shadow-lg">
                                                {study.client}
                                            </h3>
                                        </motion.div>

                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={inView ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -45 }}
                                            transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                            className="absolute top-4 right-4 w-20 h-20 bg-paper/10 rounded-full blur-xl"
                                        />
                                    </div>

                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: '100%' }}
                                        transition={{ duration: 0.8 }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                        transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                                    >
                                        <div className="text-body-sm text-paper/50 mb-1 uppercase tracking-wide">
                                            Challenge
                                        </div>
                                        <p className="text-body-sm text-paper font-medium">
                                            {study.challenge}
                                        </p>
                                    </motion.div>

                                    <motion.div
                                        className="pt-4 border-t border-neutral-700"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                                    >
                                        <div className="flex items-baseline justify-between mb-1">
                                            <span className="text-body-sm text-paper/50 uppercase tracking-wide">
                                                Result
                                            </span>
                                            <span className="text-body-sm text-paper/50">
                                                {study.period}
                                            </span>
                                        </div>
                                        <motion.div
                                            className="text-heading-lg font-bold text-accent"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                                            transition={{ duration: 0.5, delay: 0.6 + index * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                        >
                                            {study.result}
                                        </motion.div>
                                    </motion.div>

                                    <motion.div
                                        className="flex items-center text-paper font-medium group-hover:text-accent transition-colors duration-300"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                        transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                                        whileHover={{ x: 5 }}
                                    >
                                        <span className="mr-2">View Full Story</span>
                                        <motion.svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="transform"
                                            animate={{ x: [0, 3, 0] }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                        >
                                            <path
                                                d="M4 10H16M16 10L12 6M16 10L12 14"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </motion.svg>
                                    </motion.div>
                                </div>

                                <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/95 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                                    <div className="text-center space-y-4 px-6">
                                        <div className="text-display-sm font-bold text-accent">
                                            {study.result}
                                        </div>
                                        <div className="inline-flex items-center text-paper font-medium">
                                            <span className="mr-2">View Full Case Study</span>
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M4 10H16M16 10L12 6M16 10L12 14" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="text-center mt-10"
                    >
                        <button className="btn-secondary">
                            View All Case Studies
                        </button>
                    </motion.div>
                </div>
            </section>

            <AnimatePresence>
                {selectedStudy && (
                    <CaseStudyDetail
                        study={selectedStudy}
                        onClose={() => setSelectedStudy(null)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}

export default CaseStudies
