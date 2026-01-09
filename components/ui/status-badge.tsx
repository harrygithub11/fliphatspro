// PROFESSIONAL STATUS BADGE COMPONENT
// Drop-in replacement for task status display with new color system

import React from 'react';
import { Badge } from '@/components/ui/badge';

// Professional color system - DO NOT MODIFY
const STATUS_COLORS = {
    open: {
        bg: '#F1F5F9',
        text: '#475569',
        border: '#CBD5E1',
        label: 'TO DO'
    },
    in_progress: {
        bg: '#E0F2FE',
        text: '#0369A1',
        border: '#7DD3FC',
        label: 'IN PROGRESS'
    },
    done: {
        bg: '#ECFDF5',
        text: '#047857',
        border: '#6EE7B7',
        label: 'COMPLETE'
    }
} as const;

interface StatusBadgeProps {
    status: 'open' | 'in_progress' | 'done';
    className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.open;

    return (
        <Badge
            className={`px-3 py-1 rounded-full text-xs font-medium border ${className}`}
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                borderColor: colors.border,
            }}
        >
            {colors.label}
        </Badge>
    );
}

// Export for use in select dropdowns, filters, etc.
export { STATUS_COLORS };
