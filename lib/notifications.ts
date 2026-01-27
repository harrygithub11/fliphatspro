
import { prisma } from '@/lib/prisma';

export type NotificationType = 'info' | 'warning' | 'success' | 'error' | 'system' | 'mention' | 'task_assigned';

interface CreateNotificationParams {
    tenantId: string;
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: any;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification({
    tenantId,
    userId,
    title,
    message,
    type,
    link,
    data
}: CreateNotificationParams) {
    try {
        // Use raw SQL to bypass Prisma client stale types issues
        await prisma.$executeRawUnsafe(
            `INSERT INTO notifications (tenantId, userId, user_id, title, message, type, is_read, link, data, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            tenantId,
            userId,
            userId,
            title,
            message,
            type,
            0, // is_read = false
            link || null,
            data ? JSON.stringify(data) : null
        );
    } catch (error) {
        console.error('Failed to create notification (Raw SQL):', error);
    }
}
