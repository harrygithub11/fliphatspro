// Utility function to get initials from name
export function getInitials(name: string): string {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Utility function to get color for admin based on name
export function getAdminColor(name: string): string {
    if (!name) return 'bg-gray-500';

    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-orange-500',
        'bg-teal-500',
        'bg-indigo-500',
        'bg-red-500',
    ];

    // Simple hash function to consistently assign colors
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}
