'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ComposeEmailData {
    to?: string;
    subject?: string;
    body?: string;
    customerId?: number; // For linking interactions
}

interface ComposeEmailContextType {
    isOpen: boolean;
    data: ComposeEmailData;
    openCompose: (data?: ComposeEmailData) => void;
    closeCompose: () => void;
}

const ComposeEmailContext = createContext<ComposeEmailContextType | undefined>(undefined);

export function ComposeEmailProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<ComposeEmailData>({});

    const openCompose = (initialData?: ComposeEmailData) => {
        if (initialData) setData(initialData);
        setIsOpen(true);
    };

    const closeCompose = () => {
        setIsOpen(false);
        setData({}); // Optional: clear data on close, or keep draft? Keeping it simple for now.
    };

    return (
        <ComposeEmailContext.Provider value={{ isOpen, data, openCompose, closeCompose }}>
            {children}
        </ComposeEmailContext.Provider>
    );
}

export function useComposeEmail() {
    const context = useContext(ComposeEmailContext);
    if (context === undefined) {
        throw new Error('useComposeEmail must be used within a ComposeEmailProvider');
    }
    return context;
}
