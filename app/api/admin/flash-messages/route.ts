import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const withUserId = searchParams.get('withUserId');

        // Case 1: Fetch Chat History with specific user
        if (type === 'chat' && withUserId) {
            const partnerId = parseInt(withUserId);
            const messages = await prisma.flashMessage.findMany({
                where: {
                    type: 'chat',
                    OR: [
                        { senderId: session.id, receiverId: partnerId },
                        { senderId: partnerId, receiverId: session.id }
                    ]
                },
                include: {
                    sender: { select: { id: true, name: true, avatar_url: true } },
                    receiver: { select: { id: true, name: true, avatar_url: true } }
                },
                orderBy: { sentAt: 'asc' },
                take: 100
            });
            return NextResponse.json({ success: true, messages });
        }

        // Case 1.5: Group Chat (General)
        if (type === 'group_chat') {
            const messages = await prisma.flashMessage.findMany({
                where: {
                    type: 'group_chat',
                    receiverId: null
                },
                include: {
                    sender: { select: { id: true, name: true, avatar_url: true } }
                },
                orderBy: { sentAt: 'asc' }, // Chat order
                take: 100
            });
            return NextResponse.json({ success: true, messages });
        }

        // Case 2: Fetch Unread Chats
        if (type === 'unread_chats') {
            const messages = await prisma.flashMessage.findMany({
                where: {
                    receiverId: session.id,
                    isRead: false,
                    type: 'chat'
                },
                select: { id: true, senderId: true }
            });
            return NextResponse.json({ success: true, messages });
        }

        // Case 3: Fetch Recent Chat Activity (List of conversations)
        if (type === 'conversations') {
            // This is a bit complex in pure Prisma without raw SQL for "distinct recent", 
            // so for now we just fetch recent 100 messages involving user and client-side distinct?
            // Or we just return list of admins (handled by frontend for now).
            // Let's sticking to fetching unread chats count per user?
            const unreadCounts = await prisma.flashMessage.groupBy({
                by: ['senderId'],
                where: {
                    receiverId: session.id,
                    isRead: false,
                    type: 'chat'
                },
                _count: { id: true }
            });
            return NextResponse.json({ success: true, unreadCounts });
        }

        // Case 4: History of Flash Messages (Broadcasts)
        if (type === 'history') {
            const messages = await prisma.flashMessage.findMany({
                where: {
                    type: 'flash',
                    OR: [
                        { senderId: session.id },
                        { receiverId: session.id }
                    ]
                },
                include: {
                    sender: { select: { id: true, name: true, avatar_url: true } },
                    receiver: { select: { id: true, name: true, avatar_url: true } }
                },
                orderBy: { sentAt: 'desc' },
                take: 50
            });
            return NextResponse.json({ success: true, messages });
        }

        // Default: Fetch unread FLASH messages (for Popup)
        // IMPORTANT: Filter by type='flash' so chats don't pop up
        const messages = await prisma.flashMessage.findMany({
            where: {
                receiverId: session.id,
                isRead: false,
                type: 'flash' // Only flash messages trigger popup
            },
            include: {
                sender: { select: { id: true, name: true, avatar_url: true } },
                parentMessage: true
            },
            orderBy: { sentAt: 'desc' }
        });

        return NextResponse.json({ success: true, messages });

    } catch (error) {
        console.error('Error fetching flash messages:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { receiverId, message, parentMessageId, type = 'flash', attachmentUrl, attachmentType } = body;

        // Validation: receiverId is required unless it's a group chat
        if ((!receiverId && type !== 'group_chat') || !message) {
            return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
        }

        const newMessage = await prisma.flashMessage.create({
            data: {
                senderId: session.id,
                receiverId: receiverId ? parseInt(receiverId) : null,
                message,
                attachmentUrl,
                attachmentType,
                parentMessageId,
                type, // 'flash' or 'chat' or 'group_chat'
                isRead: false
            },
            include: {
                sender: { select: { id: true, name: true, avatar_url: true } },
                receiver: { select: { id: true, name: true, avatar_url: true } }
            }
        });

        return NextResponse.json({ success: true, message: newMessage });

    } catch (error) {
        console.error('Error sending flash message:', error);
        return NextResponse.json({ success: false, message: 'Failed to send message' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ success: false, message: 'Missing message ID' }, { status: 400 });
        }

        // Verify ownership (only receiver can mark/read)
        const message = await prisma.flashMessage.findUnique({ where: { id } });
        if (!message) {
            return NextResponse.json({ success: false, message: 'Message not found' }, { status: 404 });
        }

        if (message.receiverId !== session.id) {
            // Alternatively, maybe sender can update content? But this endpoint is for marking Read.
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
        }

        const updated = await prisma.flashMessage.update({
            where: { id },
            data: { isRead: true, readAt: new Date() }
        });

        return NextResponse.json({ success: true, message: updated });

    } catch (error) {
        console.error('Error updating flash message:', error);
        return NextResponse.json({ success: false, message: 'Failed to update message' }, { status: 500 });
    }
}
