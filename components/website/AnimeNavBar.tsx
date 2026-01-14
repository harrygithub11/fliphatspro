'use client'

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface NavItem {
    name: string
    href: string
    icon: LucideIcon
}

interface AnimeNavBarProps {
    items: NavItem[]
    className?: string
    defaultActive?: string
}

export function AnimeNavBar({ items, className, defaultActive = "Home" }: AnimeNavBarProps) {
    const [mounted, setMounted] = useState(false)
    const [hoveredTab, setHoveredTab] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState(defaultActive)
    const [isMobile, setIsMobile] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    if (!mounted) return null

    return (
        <>
            <div className="fixed top-4 md:top-5 left-0 right-0 z-[9999]">
                <div className="flex justify-center pt-2 md:pt-6 px-4">
                    <motion.div
                        className="flex items-center gap-3 bg-black/50 border border-white/10 backdrop-blur-lg py-2 px-2 rounded-full shadow-lg relative"
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                        }}
                    >
                        {/* Logo and Brand Name */}
                        <a href="#home" className="flex items-center gap-2 pl-4 pr-2">
                            <img
                                src="/website/images/logo.png"
                                alt="Fliphats"
                                className="w-8 h-auto"
                            />
                            <span className="text-white font-bold text-sm whitespace-nowrap">
                                Fliphats
                            </span>
                        </a>

                        {/* Divider - Hidden on mobile */}
                        <div className="w-px h-8 bg-white/20 hidden md:block" />

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-3">
                            {items.map((item) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.name
                                const isHovered = hoveredTab === item.name

                                return (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setActiveTab(item.name)
                                            const element = document.querySelector(item.href)
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' })
                                            }
                                        }}
                                        onMouseEnter={() => setHoveredTab(item.name)}
                                        onMouseLeave={() => setHoveredTab(null)}
                                        className={cn(
                                            "relative cursor-pointer text-sm font-semibold px-6 py-3 rounded-full transition-all duration-300",
                                            "text-white/70 hover:text-white",
                                            isActive && "text-white"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                className="absolute inset-0 rounded-full -z-10 overflow-hidden"
                                                initial={{ opacity: 0 }}
                                                animate={{
                                                    opacity: [0.3, 0.5, 0.3],
                                                    scale: [1, 1.03, 1]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeInOut"
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-accent/25 rounded-full blur-md" />
                                                <div className="absolute inset-[-4px] bg-accent/20 rounded-full blur-xl" />
                                                <div className="absolute inset-[-8px] bg-accent/15 rounded-full blur-2xl" />
                                                <div className="absolute inset-[-12px] bg-accent/5 rounded-full blur-3xl" />

                                                <div
                                                    className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/20 to-accent/0"
                                                    style={{
                                                        animation: "shine 3s ease-in-out infinite"
                                                    }}
                                                />
                                            </motion.div>
                                        )}

                                        <motion.span
                                            className="hidden md:inline relative z-10"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {item.name}
                                        </motion.span>
                                        <motion.span
                                            className="md:hidden relative z-10"
                                            whileHover={{ scale: 1.2 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Icon size={18} strokeWidth={2.5} />
                                        </motion.span>

                                        <AnimatePresence>
                                            {isHovered && !isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                    className="absolute inset-0 bg-white/10 rounded-full -z-10"
                                                />
                                            )}
                                        </AnimatePresence>

                                        {isActive && (
                                            <motion.div
                                                layoutId="anime-mascot"
                                                className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none"
                                                initial={false}
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 300,
                                                    damping: 30,
                                                }}
                                            >
                                                <div className="relative w-12 h-12">
                                                    <motion.div
                                                        className="absolute w-10 h-10 bg-white rounded-full left-1/2 -translate-x-1/2"
                                                        animate={
                                                            hoveredTab ? {
                                                                scale: [1, 1.1, 1],
                                                                rotate: [0, -5, 5, 0],
                                                                transition: {
                                                                    duration: 0.5,
                                                                    ease: "easeInOut"
                                                                }
                                                            } : {
                                                                y: [0, -3, 0],
                                                                transition: {
                                                                    duration: 2,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut"
                                                                }
                                                            }
                                                        }
                                                    >
                                                        <motion.div
                                                            className="absolute w-2 h-2 bg-black rounded-full"
                                                            animate={
                                                                hoveredTab ? {
                                                                    scaleY: [1, 0.2, 1],
                                                                    transition: {
                                                                        duration: 0.2,
                                                                        times: [0, 0.5, 1]
                                                                    }
                                                                } : {}
                                                            }
                                                            style={{ left: '25%', top: '40%' }}
                                                        />
                                                        <motion.div
                                                            className="absolute w-2 h-2 bg-black rounded-full"
                                                            animate={
                                                                hoveredTab ? {
                                                                    scaleY: [1, 0.2, 1],
                                                                    transition: {
                                                                        duration: 0.2,
                                                                        times: [0, 0.5, 1]
                                                                    }
                                                                } : {}
                                                            }
                                                            style={{ right: '25%', top: '40%' }}
                                                        />
                                                        <motion.div
                                                            className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                                                            animate={{
                                                                opacity: hoveredTab ? 0.8 : 0.6
                                                            }}
                                                            style={{ left: '15%', top: '55%' }}
                                                        />
                                                        <motion.div
                                                            className="absolute w-2 h-1.5 bg-pink-300 rounded-full"
                                                            animate={{
                                                                opacity: hoveredTab ? 0.8 : 0.6
                                                            }}
                                                            style={{ right: '15%', top: '55%' }}
                                                        />

                                                        <motion.div
                                                            className="absolute w-4 h-2 border-b-2 border-black rounded-full"
                                                            animate={
                                                                hoveredTab ? {
                                                                    scaleY: 1.5,
                                                                    y: -1
                                                                } : {
                                                                    scaleY: 1,
                                                                    y: 0
                                                                }
                                                            }
                                                            style={{ left: '30%', top: '60%' }}
                                                        />
                                                        <AnimatePresence>
                                                            {hoveredTab && (
                                                                <>
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0 }}
                                                                        className="absolute -top-1 -right-1 w-2 h-2 text-yellow-300"
                                                                    >
                                                                        ✨
                                                                    </motion.div>
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0 }}
                                                                        transition={{ delay: 0.1 }}
                                                                        className="absolute -top-2 left-0 w-2 h-2 text-yellow-300"
                                                                    >
                                                                        ✨
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                    <motion.div
                                                        className="absolute -bottom-1 left-1/2 w-4 h-4 -translate-x-1/2"
                                                        animate={
                                                            hoveredTab ? {
                                                                y: [0, -4, 0],
                                                                transition: {
                                                                    duration: 0.3,
                                                                    repeat: Infinity,
                                                                    repeatType: "reverse"
                                                                }
                                                            } : {
                                                                y: [0, 2, 0],
                                                                transition: {
                                                                    duration: 1,
                                                                    repeat: Infinity,
                                                                    ease: "easeInOut",
                                                                    delay: 0.5
                                                                }
                                                            }
                                                        }
                                                    >
                                                        <div className="w-full h-full bg-white rotate-45 transform origin-center" />
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </a>
                                )
                            })}
                        </div>

                        {/* Mobile Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden relative w-10 h-10 flex items-center justify-center focus:outline-none ml-2"
                            aria-label="Toggle menu"
                        >
                            <div className="w-6 flex flex-col justify-center items-center space-y-1.5">
                                <motion.span
                                    animate={isMobileMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
                                    className="w-full h-0.5 bg-white transition-all"
                                />
                                <motion.span
                                    animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
                                    className="w-full h-0.5 bg-white transition-all"
                                />
                                <motion.span
                                    animate={isMobileMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
                                    className="w-full h-0.5 bg-white transition-all"
                                />
                            </div>
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-screen w-64 bg-black/95 backdrop-blur-lg border-l border-white/10 z-[9998] md:hidden"
                    >
                        <div className="flex flex-col h-full pt-24 px-6">
                            {items.map((item, index) => {
                                const Icon = item.icon
                                const isActive = activeTab === item.name

                                return (
                                    <motion.a
                                        key={item.name}
                                        href={item.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setActiveTab(item.name)
                                            setIsMobileMenuOpen(false)
                                            const element = document.querySelector(item.href)
                                            if (element) {
                                                element.scrollIntoView({ behavior: 'smooth' })
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-4 py-4 px-4 rounded-lg transition-all duration-300 mb-2",
                                            isActive
                                                ? "bg-accent/20 text-white border-l-4 border-accent"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <Icon size={20} strokeWidth={2} />
                                        <span className="font-medium">{item.name}</span>
                                    </motion.a>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9997] md:hidden"
                    />
                )}
            </AnimatePresence>
        </>
    )
}
