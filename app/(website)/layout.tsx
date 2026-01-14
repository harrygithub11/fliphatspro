import '@/app/globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'FlipHat Media | Creative & Performance Marketing Agency',
    description: 'FlipHat Media is a creative and performance marketing agency. We blend creativity with strategy to help brands grow smarter, faster, and stronger.',
}

export default function WebsiteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
