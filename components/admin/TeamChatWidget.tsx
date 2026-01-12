import { useState, useEffect, useRef } from 'react';
import { useFlashMessages, FlashMessage } from '@/hooks/useFlashMessages';
import { usePersistentState } from '@/hooks/use-persistent-state';
import { MessageSquare, X, Send, User, MoreVertical, Minimize2, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { io, Socket } from "socket.io-client";

interface ChatUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    isOnline?: boolean;
    lastSeen?: string;
}

export function TeamChatWidget() {
    const { fetchMessages, unreadChatMessages, markAsRead: markAsReadApi } = useFlashMessages();
    const [isOpen, setIsOpen] = usePersistentState('chat.isOpen', false);
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [messages, setMessages] = useState<FlashMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Socket State
    const [socket, setSocket] = useState<Socket | null>(null);
    const [self, setSelf] = useState<{ id: number; name: string } | null>(null);

    // 1. Fetch Self & Connect Socket
    useEffect(() => {
        // Fetch current user
        fetch('/api/admin/me')
            .then(res => res.json())
            .then(data => {
                if (data.success && data.admin) {
                    setSelf(data.admin);
                }
            })
            .catch(err => console.error("Failed to fetch me", err));
    }, []);

    useEffect(() => {
        if (!self) return;

        // Initialize Socket
        // In Prod: window.location.origin handles it (if same domain/port or proxied)
        // If port 3056 is exposed separately, might need explicit URL. 
        // Assuming Next.js runs the custom server on the same port/domain.
        const socketUrl = window.location.origin;
        const newSocket = io(socketUrl);

        newSocket.on('connect', () => {
            console.log("Connected to Realtime Chat");
            newSocket.emit('identify', self.id);
        });

        newSocket.on('message_received', (msg: FlashMessage) => {
            // Add to messages if talking to this user OR if it's group chat
            setMessages(prev => {
                // Check if msg belongs to current conversation
                // If activeUser is Group (-1) -> accept type='group_chat'
                // If activeUser is Person (senderId) -> accept msg.senderId === activeUser.id (Incoming)
                // If activeUser is Person (receiverId) -> accept msg.receiverId === activeUser.id (Outgoing - usually local optimistic, but good to sync)

                // However, we rely on 'activeUser' state. 
                // Since this is defined in closure, we might need a ref or functional update logic.
                // Actually this closure captures initial state? No, 'setMessages' inner function is safe.
                // BUT 'activeUser' needs to be checked.
                // Best way: Don't gate here. Append ALL messages? No, that messes up the view.
                // We should only append if it matches the current view. 

                // We can't easily access 'activeUser' inside this stale closure if we don't depend on it.
                // Solution: Use a Ref for activeUser.
                return prev; // We handle this in a separate useEffect with Ref or fully depend on it.
            });
            // See 'Event Listener' effect below.
        });

        // We'll separate logic to avoid dependency cycles.
        setSocket(newSocket);

        // Heartbeat
        const beatInterval = setInterval(() => {
            newSocket.emit('heartbeat', self.id);
        }, 20000);

        return () => {
            clearInterval(beatInterval);
            newSocket.disconnect();
        };
    }, [self]);

    // Ref for Active User to use in Socket listeners
    const activeUserRef = useRef(activeUser);
    useEffect(() => { activeUserRef.current = activeUser; }, [activeUser]);

    // Socket Event Listeners for Data
    useEffect(() => {
        if (!socket) return;

        const handleMessage = (msg: FlashMessage) => {
            const current = activeUserRef.current;
            if (!current) return;

            const isGroup = current.id === -1 && msg.type === 'group_chat';
            const isDirect = current.id !== -1 && (msg.senderId === current.id || msg.receiverId === current.id);

            if (isGroup || isDirect) {
                setMessages(prev => {
                    if (prev.find(m => m.id === msg.id)) return prev; // Dedup
                    return [...prev, msg];
                });

                // Mark read if unrelated to validity
                if (msg.senderId !== self?.id) {
                    socket.emit('mark_read', { messageId: msg.id, userId: self?.id });
                }
            }
        };

        const handleStatusUpdate = (update: { id: string, status: 'delivered' | 'read', deliveredAt?: string, readAt?: string }) => {
            setMessages(prev => prev.map(m => {
                if (m.id === update.id) {
                    return {
                        ...m,
                        deliveredAt: update.status === 'delivered' ? (update.deliveredAt || m.deliveredAt) : m.deliveredAt, // Type mismatch fix might be needed
                        readAt: update.status === 'read' ? (update.readAt || m.readAt) : m.readAt,
                        isRead: update.status === 'read' ? true : m.isRead
                    } as FlashMessage; // Casting if API types differ slightly
                }
                return m;
            }));
        };

        const handlePresence = (data: { userId: number, status: string, lastSeenAt: string }) => {
            setUsers(prev => prev.map(u => {
                if (u.id === data.userId) {
                    return {
                        ...u,
                        isOnline: data.status === 'ONLINE',
                        lastSeen: data.lastSeenAt
                    };
                }
                return u;
            }));
        };

        socket.on('message_received', handleMessage);
        socket.on('message_sent_ack', handleMessage); // Same logic, append
        socket.on('message_status_update', handleStatusUpdate);
        socket.on('presence_update', handlePresence);

        return () => {
            socket.off('message_received', handleMessage);
            socket.off('message_sent_ack', handleMessage);
            socket.off('message_status_update', handleStatusUpdate);
            socket.off('presence_update', handlePresence);
        };
    }, [socket, self]); // self needed for 'mark_read' check


    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);
            if (file.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(file));
            } else {
                setPreviewUrl(null);
            }
        }
    };

    // Load Users
    useEffect(() => {
        if (isOpen) {
            fetch('/api/admin/team')
                .then(res => res.json())
                .then(data => {
                    let teamMembers: ChatUser[] = [];
                    if (Array.isArray(data)) teamMembers = data;
                    else if (data.members && Array.isArray(data.members)) teamMembers = data.members;

                    const groupOption: ChatUser = {
                        id: -1, name: "Team Group", email: "Everyone",
                        avatar_url: "/group-icon-placeholder.png", isOnline: true
                    };
                    setUsers([groupOption, ...teamMembers]);
                }).catch(() => { });
        }
    }, [isOpen]);

    // Initial Message Load (History)
    useEffect(() => {
        if (isOpen && activeUser) {
            setMessages([]); // Clear previous
            const type = activeUser.id === -1 ? 'group_chat' : 'chat';
            const userId = activeUser.id === -1 ? undefined : activeUser.id;

            fetchMessages(type, userId).then((msgs: FlashMessage[]) => {
                setMessages(msgs);
                // Mark all visible as read
                msgs.forEach((m) => {
                    if (m.senderId === activeUser.id && !m.isRead && socket && self) {
                        socket.emit('mark_read', { messageId: m.id, userId: self.id });
                    }
                });
            });
        }
    }, [isOpen, activeUser, fetchMessages, socket, self]);

    const hasUnread = unreadChatMessages.length > 0;

    // Smart Auto-scroll
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 200;

        // Always scroll on first load (messages length change from 0) 
        // But here we rely on isNearBottom. 
        // To force scroll on NEW message if near bottom:
        if (isNearBottom || messages.length < 5) { // Simple heuristic
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if ((!inputText.trim() && !attachment) || !activeUser || !socket || !self) return;
        setLoading(true);
        try {
            let uploadedUrl = undefined;
            let uploadedType = undefined;

            if (attachment) {
                const formData = new FormData();
                formData.append('file', attachment); // Keep existing upload API
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) {
                    uploadedUrl = data.url;
                    uploadedType = data.type;
                }
            }

            const type = activeUser.id === -1 ? 'group_chat' : 'chat';
            const text = inputText.trim() || (attachment ? 'Sent an attachment' : '');

            // Emit via Socket
            socket.emit('send_message', {
                senderId: self.id,
                receiverId: activeUser.id,
                message: text,
                type,
                attachmentUrl: uploadedUrl,
                attachmentType: uploadedType
            });

            setInputText('');
            setAttachment(null);
            setPreviewUrl(null);
            // No need to setMessages here, we listen for 'message_sent_ack'

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Sticky Trigger Button */}
            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <style>{`
                        @keyframes gentlePulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.05); }
                        }
                    `}</style>
                    <Button
                        onClick={() => setIsOpen(true)}
                        style={{ animation: hasUnread ? 'gentlePulse 3s infinite ease-in-out' : 'none' }}
                        className={cn(
                            "h-14 w-14 rounded-full shadow-2xl bg-red-600 hover:bg-red-700 text-white animate-in zoom-in duration-300 flex items-center justify-center p-0 transition-all",
                            hasUnread && "ring-4 ring-red-300"
                        )}
                    >
                        <MessageSquare className="w-7 h-7" />
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
                            </span>
                        )}
                    </Button>
                </div>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    {/* Header */}
                    <div className="p-4 bg-red-600 text-white flex items-center justify-between shrink-0 shadow-sm z-10">
                        {activeUser ? (
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 -ml-2 rounded-full" onClick={() => setActiveUser(null)}>
                                    <X className="w-5 h-5 rotate-45" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border-2 border-white/20">
                                            <AvatarImage src={activeUser.avatar_url} />
                                            <AvatarFallback className="bg-red-800 text-xs">{activeUser.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className={cn(
                                            "absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-red-600 rounded-full",
                                            activeUser.isOnline ? "bg-green-400" : "bg-zinc-400"
                                        )}></span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm leading-tight">{activeUser.name}</h3>
                                        <p className="text-[10px] text-red-200">
                                            {activeUser.id === -1 ? 'Everyone' : (
                                                activeUser.isOnline ? 'Online' : (
                                                    activeUser.lastSeen ? `Last seen ${new Date(activeUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Offline'
                                                )
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                <h3 className="font-bold">Team Chat</h3>
                            </div>
                        )}
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                                <Minimize2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950/50 relative">
                        {activeUser ? (
                            // Chat View
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <MessageSquare className="w-12 h-12 mb-2" />
                                            <p className="text-sm">Start a conversation</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => {
                                            const isMe = msg.senderId === self?.id;
                                            const isIncoming = !isMe;

                                            return (
                                                <div key={msg.id} className={cn("flex flex-col gap-1", isIncoming ? "items-start" : "items-end")}>
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group",
                                                        isIncoming
                                                            ? "bg-white dark:bg-zinc-800 text-foreground rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                                                            : "bg-red-600 text-white rounded-tr-none"
                                                    )}>
                                                        {msg.attachmentUrl && (
                                                            <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                                                {msg.attachmentType === 'image' ? (
                                                                    <img
                                                                        src={msg.attachmentUrl}
                                                                        alt="attachment"
                                                                        className="max-w-full h-auto max-h-48 object-cover block"
                                                                        onError={(e) => {
                                                                            (e.target as HTMLImageElement).src = '/file-fallback.png';
                                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 hover:bg-black/10 transition-colors">
                                                                        <FileText className="w-4 h-4" />
                                                                        <span className="underline text-xs">Download {msg.attachmentType || 'File'}</span>
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.message}
                                                        <div className={cn("flex items-center gap-1 justify-end mt-1 opacity-70", isIncoming ? "text-muted-foreground" : "text-red-100")}>
                                                            <span className="text-[10px]">
                                                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            {!isIncoming && (
                                                                <span title={msg.readAt ? `Seen ${new Date(msg.readAt).toLocaleTimeString()}` : (msg.deliveredAt ? "Delivered" : "Sent")}>
                                                                    {msg.isRead ? ( // Blue Ticks (simulated)
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
                                                                    ) : msg.deliveredAt ? ( // Double Gray Ticks
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
                                                                    ) : ( // Single Tick
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                                    {attachment && (
                                        <div className="mb-2 flex items-center gap-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                            {previewUrl ? (
                                                <img src={previewUrl} className="h-10 w-10 object-cover rounded" />
                                            ) : (
                                                <div className="h-10 w-10 bg-zinc-200 rounded flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs truncate font-medium">{attachment.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full" onClick={() => { setAttachment(null); setPreviewUrl(null); }}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}

                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                        className="flex gap-2 items-center"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="h-10 w-10 rounded-full text-zinc-500 hover:bg-zinc-100"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </Button>

                                        <input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder={attachment ? "Add a caption..." : "Type a message..."}
                                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={(!inputText.trim() && !attachment) || loading}
                                            className="h-10 w-10 rounded-full bg-red-600 hover:bg-red-700 shrink-0"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            <div className="absolute inset-0 overflow-y-auto p-2">
                                <div className="space-y-1">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => setActiveUser(u)}
                                            className="w-full p-3 flex items-center gap-3 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm"
                                        >
                                            <Avatar>
                                                <AvatarImage src={u.avatar_url} />
                                                <AvatarFallback>{u.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-left flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm truncate">{u.name}</h4>
                                                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                            </div>
                                            <div className={cn("w-2 h-2 rounded-full", u.isOnline ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600")}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
