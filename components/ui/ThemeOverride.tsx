'use client';

import { useEffect } from 'react';

export function ThemeOverride() {
    useEffect(() => {
        // Store original styles
        const originalBg = document.body.style.backgroundColor;
        const originalOverflowX = document.body.style.overflowX;

        // Apply overrides
        document.body.style.backgroundColor = '#000000';
        document.body.style.overflowX = 'hidden';

        return () => {
            // Restore original styles
            document.body.style.backgroundColor = originalBg;
            document.body.style.overflowX = originalOverflowX;
        };
    }, []);

    return null;
}
