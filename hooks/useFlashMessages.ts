import { useState, useEffect, useCallback } from 'react';

export interface FlashMessage {
    id: string;
    senderId: number;
    receiverId?: number | null; // Made optional/nullable
    message: string;
    isRead: boolean;
    sentAt: string;
    readAt?: string | null;
    deliveredAt?: string | null;
    type?: string; // 'flash', 'chat', 'group_chat'
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    sender?: { // Made optional as sometimes we just get ID
        id: number;
        name: string;
        avatar_url: string | null;
    };
    parentMessage?: FlashMessage;
}

export function useFlashMessages() {
    const [unreadMessages, setUnreadMessages] = useState<FlashMessage[]>([]);
    const [loading, setLoading] = useState(false);

    const [unreadChatMessages, setUnreadChatMessages] = useState<FlashMessage[]>([]);

    const fetchMessages = useCallback(async (type: 'flash' | 'chat' | 'history' | 'unread_chats' | 'group_chat' = 'flash', withUserId?: number) => {
        try {
            let url = `/api/admin/flash-messages?type=${type}`;
            if (withUserId) url += `&withUserId=${withUserId}`;

            const res = await fetch(url);
            const data = await res.json();
            return data.success ? data.messages : [];
        } catch (error) {
            console.error('Failed to fetch messages', error);
            return [];
        }
    }, []);

    // Polling for Flash Messages & Unread Chats
    const fetchUnreadFlash = useCallback(async () => {
        const msgs = await fetchMessages('flash');
        setUnreadMessages(msgs);
    }, [fetchMessages]);

    const fetchUnreadChats = useCallback(async () => {
        const msgs = await fetchMessages('unread_chats');
        setUnreadChatMessages(msgs);
    }, [fetchMessages]);

    const sendMessage = async (receiverId: number, message: string, parentMessageId?: string, type: 'flash' | 'chat' | 'group_chat' = 'flash', attachmentUrl?: string, attachmentType?: string) => {
        const res = await fetch('/api/admin/flash-messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId, message, parentMessageId, type, attachmentUrl, attachmentType }),
            headers: { 'Content-Type': 'application/json' }
        });
        return await res.json();
    };

    const markAsRead = async (id: string) => {
        const res = await fetch('/api/admin/flash-messages', {
            method: 'PUT',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            setUnreadMessages(prev => prev.filter(m => m.id !== id));
            setUnreadChatMessages(prev => prev.filter(m => m.id !== id));
        }
        return data;
    };

    // Poll every 5 seconds for Flash Messages and Unread Chats
    useEffect(() => {
        fetchUnreadFlash();
        fetchUnreadChats();
        const interval = setInterval(() => {
            fetchUnreadFlash();
            fetchUnreadChats();
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchUnreadFlash, fetchUnreadChats]);

    return {
        unreadMessages,
        unreadChatMessages,
        sendMessage,
        markAsRead,
        refresh: () => { fetchUnreadFlash(); fetchUnreadChats(); },
        fetchMessages // Export for chat widget
    };
}
