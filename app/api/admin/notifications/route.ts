import { NextResponse } from 'next/server';
import { requireTenantRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { tenantId, session } = await requireTenantRole('viewer', request);
        const { id: userId } = session;

        if (!userId) {
            return NextResponse.json({ notifications: [], unreadNotifications: 0 });
        }

        // Fetch Notifications via Raw SQL to bypass stale Prisma client types
        const notifications: any = await prisma.$queryRawUnsafe(
            `SELECT id, type, title, message, is_read, created_at, link, data 
             FROM notifications 
             WHERE tenantId = ? AND userId = ? 
             ORDER BY created_at DESC 
             LIMIT 20`,
            tenantId,
            userId
        );

        // Map snake_case to camelCase for frontend compatibility if needed
        const mappedNotifications = notifications.map((n: any) => ({
            ...n,
            isRead: n.is_read,
            createdAt: n.created_at
        }));

        const unreadCountRes: any = await prisma.$queryRawUnsafe(
            `SELECT COUNT(*) as count FROM notifications WHERE tenantId = ? AND userId = ? AND is_read = 0`,
            tenantId,
            userId
        );
        const unreadCount = Number(unreadCountRes[0]?.count || 0);

        return NextResponse.json({
            notifications: mappedNotifications,
            unreadNotifications: unreadCount
        });

    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { tenantId, session } = await requireTenantRole('viewer', request);
        const { id: userId } = session;

        // Mark all as read
        await prisma.notification.updateMany({
            where: {
                tenantId: tenantId,
                userId: userId,
                is_read: false
            },
            data: {
                is_read: true
            }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error clearing notifications:', error);
        return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
    }
}
