'use client'

import { Home, Info, Briefcase, FolderOpen, Phone } from 'lucide-react'
import { AnimeNavBar } from './AnimeNavBar'

const WebsiteHeader = () => {
    const navItems = [
        { name: 'Home', href: '#home', icon: Home },
        { name: 'About Us', href: '#about', icon: Info },
        { name: 'Services', href: '#services', icon: Briefcase },
        { name: 'Work', href: '#work', icon: FolderOpen },
        { name: 'Contact Us', href: '#contact', icon: Phone }
    ]

    return <AnimeNavBar items={navItems} defaultActive="Home" />
}

export default WebsiteHeader
