'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SlugContextValue {
    slug: string;
    /** Helper to prefix paths with the current slug */
    href: (path: string) => string;
}

const SlugContext = createContext<SlugContextValue | null>(null);

export function SlugProvider({
    children,
    slug
}: {
    children: ReactNode;
    slug: string;
}) {
    const href = (path: string) => {
        // Ensure path starts with /
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `/${slug}${cleanPath}`;
    };

    return (
        <SlugContext.Provider value={{ slug, href }}>
            {children}
        </SlugContext.Provider>
    );
}

export function useSlug() {
    const context = useContext(SlugContext);
    if (!context) {
        throw new Error('useSlug must be used within a SlugProvider');
    }
    return context;
}

/**
 * Hook to safely get slug if available (for components outside slug context)
 */
export function useSlugSafe() {
    return useContext(SlugContext);
}
