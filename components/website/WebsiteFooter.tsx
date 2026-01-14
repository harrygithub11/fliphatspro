'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Social {
    name: string
    href: string
    icon: ReactNode
}

const WebsiteFooter = () => {
    const currentYear = new Date().getFullYear()

    const quickLinks = [
        { name: 'Home', href: '#home' },
        { name: 'About', href: '#about' },
        { name: 'Services', href: '#services' },
        { name: 'Work', href: '#work' },
        { name: 'Blog', href: '#blog' },
        { name: 'Contact', href: '#contact' },
        { name: 'Careers', href: '#careers' }
    ]

    const services = [
        'Performance Marketing',
        'Brand & Design',
        'Content & Social',
        'Marketing Automation',
        'Web Strategy'
    ]

    const socials: Social[] = [
        {
            name: 'LinkedIn',
            href: '#',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8.5 11V16.5M8.5 8.5V8.51M12 16.5V11M12 11C12 10 13 9.5 14 9.5C15.5 9.5 16 10.5 16 11.5V16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        },
        {
            name: 'Twitter',
            href: '#',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3.00005C22.0424 3.67552 20.9821 4.19216 19.86 4.53005C19.2577 3.83756 18.4573 3.34674 17.567 3.12397C16.6767 2.90121 15.7395 2.95724 14.8821 3.28451C14.0247 3.61179 13.2884 4.19445 12.773 4.95376C12.2575 5.71308 11.9877 6.61238 12 7.53005V8.53005C10.2426 8.57561 8.50127 8.18586 6.93101 7.39549C5.36074 6.60513 4.01032 5.43868 3 4.00005C3 4.00005 -1 13 8 17C5.94053 18.398 3.48716 19.099 1 19C10 24 21 19 21 7.50005C20.9991 7.2215 20.9723 6.94364 20.92 6.67005C21.9406 5.66354 22.6608 4.39276 23 3.00005Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        },
        {
            name: 'Instagram',
            href: '#',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                </svg>
            )
        },
        {
            name: 'Facebook',
            href: '#',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2H15C13.6739 2 12.4021 2.52678 11.4645 3.46447C10.5268 4.40215 10 5.67392 10 7V10H7V14H10V22H14V14H17L18 10H14V7C14 6.73478 14.1054 6.48043 14.2929 6.29289C14.4804 6.10536 14.7348 6 15 6H18V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
            )
        }
    ]

    return (
        <footer className="bg-ink text-paper pt-16 pb-6">
            <div className="container-custom">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
                    {/* Brand column */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex items-center space-x-2">
                            <img src="/website/images/logo.png" alt="Fliphats" width="36" height="36" />
                            <span className="text-xl font-display font-bold">Fliphats</span>
                        </div>
                        <p className="text-body-sm text-paper/70 leading-relaxed">
                            Smart ideas. Bold impact.
                        </p>
                        <p className="text-body-sm text-paper/50">
                            Shaping how the world sees your brand.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-body font-display font-bold mb-4">Quick Links</h4>
                        <ul className="space-y-2">
                            {quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a
                                        href={link.href}
                                        className="text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 inline-block hover:translate-x-1"
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h4 className="text-body font-display font-bold mb-4">Services</h4>
                        <ul className="space-y-2">
                            {services.map((service, index) => (
                                <li key={index}>
                                    <a
                                        href="#services"
                                        className="text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 inline-block hover:translate-x-1"
                                    >
                                        {service}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-body font-display font-bold mb-4">Get in Touch</h4>
                        <div className="space-y-3">
                            <a
                                href="mailto:contact@fliphats.com"
                                className="flex items-start space-x-2 text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 group"
                            >
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                                    <path d="M3 4H17C17.55 4 18 4.45 18 5V15C18 15.55 17.55 16 17 16H3C2.45 16 2 15.55 2 15V5C2 4.45 2.45 4 3 4Z" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M18 5L10 11L2 5" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span className="group-hover:underline">contact@fliphats.com</span>
                            </a>

                            <a
                                href="tel:+919602003790"
                                className="flex items-start space-x-2 text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 group"
                            >
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                                    <path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span className="group-hover:underline">+91 9602003790</span>
                            </a>

                            <a
                                href="tel:+917600047765"
                                className="flex items-start space-x-2 text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 group"
                            >
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                                    <path d="M18 14.5V17C18 17.55 17.55 18 17 18C8.16 18 1 10.84 1 2C1 1.45 1.45 1 2 1H4.5C5.05 1 5.5 1.45 5.5 2C5.5 3.25 5.7 4.45 6.07 5.57C6.18 5.92 6.1 6.31 5.82 6.59L4.62 7.79C5.87 10.62 8.38 13.13 11.21 14.38L12.41 13.18C12.69 12.9 13.08 12.82 13.43 12.93C14.55 13.3 15.75 13.5 17 13.5C17.55 13.5 18 13.95 18 14.5Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span className="group-hover:underline">+91 7600047765</span>
                            </a>

                            <a
                                href="https://www.fliphats.com"
                                className="flex items-start space-x-2 text-body-sm text-paper/70 hover:text-accent transition-colors duration-300 group"
                            >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 flex-shrink-0">
                                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M2 10H18" stroke="currentColor" strokeWidth="1.5" />
                                    <path d="M10 2C12 4.5 13 7.5 13 10C13 12.5 12 15.5 10 18C8 15.5 7 12.5 7 10C7 7.5 8 4.5 10 2Z" stroke="currentColor" strokeWidth="1.5" />
                                </svg>
                                <span className="group-hover:underline">www.fliphats.com</span>
                            </a>
                        </div>

                        {/* Social links */}
                        <div className="flex items-center space-x-3 mt-4">
                            {socials.map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-9 h-9 flex items-center justify-center bg-paper/5 rounded-lg hover:bg-accent hover:text-paper transition-all duration-300 text-paper/70"
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-6 border-t border-paper/10">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-body-sm text-paper/50">
                            © {currentYear} Fliphats. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6">
                            <a href="#privacy" className="text-body-sm text-paper/50 hover:text-accent transition-colors duration-300">
                                Privacy Policy
                            </a>
                            <a href="#terms" className="text-body-sm text-paper/50 hover:text-accent transition-colors duration-300">
                                Terms of Service
                            </a>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <p className="font-cursive text-xl text-accent/70">
                            Where creativity meets strategy
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default WebsiteFooter
