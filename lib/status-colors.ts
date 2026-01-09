// Task Status Color System
// Professional, consistent colors for task management UI

export const STATUS_COLORS = {
    todo: {
        bg: '#F1F5F9',      // Soft slate
        text: '#475569',    // Dark slate
        border: '#CBD5E1',  // Light slate border
        label: 'To Do'
    },
    in_progress: {
        bg: '#E0F2FE',      // Soft sky blue
        text: '#0369A1',    // Deep blue
        border: '#7DD3FC',  // Bright blue border
        label: 'In Progress'
    },
    done: {
        bg: '#ECFDF5',      // Soft mint
        text: '#047857',    // Deep green
        border: '#6EE7B7',  // Bright green border
        label: 'Complete'
    }
} as const;

export type TaskStatusKey = keyof typeof STATUS_COLORS;

/**
 * Get status color configuration
 * @param status - The task status key
 * @returns Color configuration object with bg, text, border
 */
export function getStatusColors(status: string): typeof STATUS_COLORS.todo {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_') as TaskStatusKey;
    return STATUS_COLORS[normalizedStatus] || STATUS_COLORS.todo;
}

/**
 * Get Tailwind CSS classes for status badge
 * @param status - The task status key
 * @returns Tailwind class string for status badge
 */
export function getStatusBadgeClasses(status: string): string {
    const colors = getStatusColors(status);

    // Return inline styles since these are custom colors
    return 'px-3 py-1 rounded-full text-xs font-medium border';
}

/**
 * Get inline styles for status badge
 * @param status - The task status key
 * @returns Inline style object
 */
export function getStatusBadgeStyles(status: string): React.CSSProperties {
    const colors = getStatusColors(status);

    return {
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
    };
}
