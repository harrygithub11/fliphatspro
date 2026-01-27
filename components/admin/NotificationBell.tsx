'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSlugSafe } from '@/lib/slug-context';
import Link from 'next/link';

interface Notification {
    id: string | number;
    type: string;
    title: string;
    message: string;
    isRead?: boolean;
    is_read?: boolean;
    createdAt?: string;
    created_at?: string;
    link?: string;
    data?: any;
}

export default function NotificationBell() {
    const slugContext = useSlugSafe();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const getFullHref = (path: string) => {
        if (!path || path === '#' || path.startsWith('http')) return path;

        // If slug is not available, return path as-is (root-relative)
        if (!slugContext?.slug) return path;

        const slug = slugContext.slug;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;

        // Prevent double-prefixing if the path already starts with the slug
        if (cleanPath.startsWith(`/${slug}/`) || cleanPath === `/${slug}`) {
            return cleanPath;
        }

        return `/${slug}${cleanPath}`;
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/admin/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadNotifications || 0);
            }
        } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        try {
            await fetch('/api/admin/notifications', { method: 'POST' });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true, is_read: true })));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const formatNotificationDate = (dateStr?: string) => {
        if (!dateStr) return 'Recently';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Recently';
        return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-zinc-500" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white border-2 border-white dark:border-zinc-950">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto px-2 py-0.5 text-xs text-blue-600 hover:text-blue-700">
                            Mark all read
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500 text-sm">
                            <div className="flex justify-center mb-2">
                                <Bell className="w-8 h-8 text-zinc-200" />
                            </div>
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map(n => {
                            const isRead = n.isRead ?? n.is_read;
                            const createdAt = n.createdAt ?? n.created_at;

                            // 1. Clean up legacy links (remove /admin prefix if present)
                            let notificationLink = n.link && n.link !== '#' ? n.link : null;
                            if (notificationLink && notificationLink.startsWith('/admin/')) {
                                notificationLink = notificationLink.replace('/admin/', '/');
                            }

                            // 2. Fallback: If no link but we have metadata in data, generate one
                            if (!notificationLink && n.data) {
                                try {
                                    // Handle both JSON string and object
                                    const dataArr = typeof n.data === 'string' ? JSON.parse(n.data) : n.data;
                                    if (dataArr.taskId) {
                                        notificationLink = `/workspace?taskId=${dataArr.taskId}`;
                                    } else if (dataArr.leadId) {
                                        notificationLink = `/leads/${dataArr.leadId}`;
                                    } else if (dataArr.dealId) {
                                        notificationLink = `/deals?id=${dataArr.dealId}`;
                                    }
                                } catch (e) {
                                    console.error('Failed to parse notification data', e);
                                }
                            }

                            const fullHref = notificationLink ? getFullHref(notificationLink) : null;

                            const content = (
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1">
                                        <p className={`text-sm ${!isRead ? 'font-semibold' : 'font-medium'} text-zinc-900 dark:text-zinc-100`}>{n.title}</p>
                                        <p className="text-xs text-zinc-500 line-clamp-2">{n.message}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-medium">
                                                {formatNotificationDate(createdAt)}
                                            </p>
                                            {fullHref && (
                                                <span className="text-[10px] text-blue-500 font-semibold">• View Task</span>
                                            )}
                                        </div>
                                    </div>
                                    {!isRead && (
                                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] shrink-0" />
                                    )}
                                </div>
                            );

                            const baseClassName = `block px-4 py-3 border-b border-zinc-50 dark:border-zinc-900 last:border-0 transition-all duration-200 ${!isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-zinc-900'}`;

                            if (fullHref) {
                                return (
                                    <Link
                                        key={n.id}
                                        href={fullHref}
                                        className={`${baseClassName} hover:bg-zinc-100 dark:hover:bg-zinc-800/80 cursor-pointer active:scale-[0.98]`}
                                    >
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <div key={n.id} className={`${baseClassName} opacity-80 cursor-default`}>
                                    {content}
                                </div>
                            );
                        })
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
