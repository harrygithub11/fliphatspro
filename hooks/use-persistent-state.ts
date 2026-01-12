import { useState, useEffect } from 'react';

/**
 * A custom hook to persist UI state to localStorage.
 * Automatically prefixes keys with 'crm.ui.' to avoid collisions.
 * 
 * @param key The unique key for the state (e.g., 'sidebar.collapsed')
 * @param initialValue The default value if no saved state exists
 * @returns [state, setState]
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    // Prefix the key to ensure we only touch our own namespace
    const storageKey = `crm.ui.${key}`;

    // Initialize state
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;

        try {
            const item = window.localStorage.getItem(storageKey);
            // Parse stored json or if undefined return initialValue
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${storageKey}":`, error);
            return initialValue;
        }
    });

    // Update localStorage whenever state changes
    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(storageKey, JSON.stringify(state));
            }
        } catch (error) {
            console.warn(`Error writing localStorage key "${storageKey}":`, error);
        }
    }, [storageKey, state]);

    return [state, setState];
}
