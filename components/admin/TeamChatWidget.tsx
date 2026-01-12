import { useState, useEffect, useRef } from 'react';
import { useFlashMessages, FlashMessage } from '@/hooks/useFlashMessages';
import { MessageSquare, X, Send, User, MoreVertical, Minimize2, Paperclip, Image as ImageIcon, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatUser {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
}

export function TeamChatWidget() {
    const { sendMessage, fetchMessages, unreadChatMessages, markAsRead } = useFlashMessages();
    const [isOpen, setIsOpen] = useState(false);
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [messages, setMessages] = useState<FlashMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [attachment, setAttachment] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAttachment(file);

            // Create preview if image
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const hasUnread = unreadChatMessages.length > 0;

    // Fetch team members on mount
    useEffect(() => {
        if (isOpen) {
            fetch('/api/admin/team')
                .then(res => res.json())
                .then(data => {
                    let teamMembers = [];
                    if (Array.isArray(data)) {
                        teamMembers = data;
                    } else if (data.members && Array.isArray(data.members)) {
                        teamMembers = data.members;
                    }

                    // Add Static Group Chat Option
                    const groupOption: ChatUser = {
                        id: -1, // Special ID for group
                        name: "Team Group",
                        email: "Everyone",
                        avatar_url: "/group-icon-placeholder.png" // We can use icon fallback
                    };

                    setUsers([groupOption, ...teamMembers]);
                })
                .catch(() => { });
        }
    }, [isOpen]);

    // Poll messages when chat is active with a user
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && activeUser) {
            const load = async () => {
                const type = activeUser.id === -1 ? 'group_chat' : 'chat';
                const userId = activeUser.id === -1 ? undefined : activeUser.id;

                const msgs = await fetchMessages(type, userId);
                setMessages(msgs);

                // Auto-mark incoming unread messages as read (Only for direct chats)
                if (type === 'chat') {
                    const unreadIncoming = msgs.filter((m: FlashMessage) => m.senderId === activeUser.id && !m.isRead);
                    if (unreadIncoming.length > 0) {
                        unreadIncoming.forEach((m: FlashMessage) => markAsRead(m.id));
                    }
                }
            };
            load();
            interval = setInterval(load, 3000); // Poll every 3s
        }
        return () => clearInterval(interval);
    }, [isOpen, activeUser, fetchMessages, markAsRead]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if ((!inputText.trim() && !attachment) || !activeUser) return;
        setLoading(true);
        try {
            let uploadedUrl = undefined;
            let uploadedType = undefined;

            if (attachment) {
                const formData = new FormData();
                formData.append('file', attachment);

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    uploadedUrl = data.url;
                    uploadedType = data.type;
                }
            }

            const type = activeUser.id === -1 ? 'group_chat' : 'chat';
            const finalMessage = inputText.trim() || (attachment ? 'Sent an attachment' : '');

            // Send 0 for group chat receiverId (API handles it)
            await sendMessage(activeUser.id === -1 ? 0 : activeUser.id, finalMessage, undefined, type, uploadedUrl, uploadedType);

            setInputText('');
            setAttachment(null);
            setPreviewUrl(null);
            // Refresh
            const loadType = activeUser.id === -1 ? 'group_chat' : 'chat';
            const loadId = activeUser.id === -1 ? undefined : activeUser.id;
            const msgs = await fetchMessages(loadType, loadId);
            setMessages(msgs);
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
                    <Button
                        onClick={() => setIsOpen(true)}
                        className={cn(
                            "h-14 w-14 rounded-full shadow-2xl bg-red-600 hover:bg-red-700 text-white animate-in zoom-in duration-300 flex items-center justify-center p-0 transition-all",
                            hasUnread && "animate-bounce ring-4 ring-red-300"
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
                                    <X className="w-5 h-5 rotate-45" /> {/* Use X as back icon rough approx or arrow */}
                                </Button>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Avatar className="h-8 w-8 border-2 border-white/20">
                                            <AvatarImage src={activeUser.avatar_url} />
                                            <AvatarFallback className="bg-red-800 text-xs">{activeUser.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-red-600 rounded-full"></span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm leading-tight">{activeUser.name}</h3>
                                        <p className="text-[10px] text-red-200">Online</p>
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
                                            const isMe = msg.senderId !== activeUser.id; // Rough check, ideal is comparing session ID but let's assume if sender != partner it is me.
                                            // Wait, if I am sender, senderId is My ID. If I am receiver, senderId is Partner ID.
                                            // Ideally I need my own ID. 
                                            // Quick fix: Check if senderId === activeUser.id (Incoming)
                                            const isIncoming = msg.senderId === activeUser.id;

                                            // Auto-mark as read if incoming and unread
                                            if (isIncoming && !msg.isRead) {
                                                // We wrap this in a timeout or check to avoid spamming api on every render
                                                // Better: use a ref to track what we've trying to mark read, or just let effects handle it?
                                                // Actually, simpler to do it in the useEffect that loads messages.
                                            }

                                            return (
                                                <div key={msg.id} className={cn("flex flex-col gap-1", isIncoming ? "items-start" : "items-end")}>
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm relative group",
                                                        isIncoming
                                                            ? "bg-white dark:bg-zinc-800 text-foreground rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                                                            : "bg-red-600 text-white rounded-tr-none"
                                                    )}>
                                                        {/* Attachment Render */}
                                                        {msg.attachmentUrl && (
                                                            <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                                                {msg.attachmentType === 'image' ? (
                                                                    <img src={msg.attachmentUrl} alt="attachment" className="max-w-full h-auto max-h-48 object-cover" />
                                                                ) : (
                                                                    <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-black/5 hover:bg-black/10 transition-colors">
                                                                        <FileText className="w-4 h-4" />
                                                                        <span className="underline text-xs">Download File</span>
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
                                                                <span title={msg.readAt ? `Seen ${new Date(msg.readAt).toLocaleTimeString()}` : "Sent"}>
                                                                    {msg.isRead ? (
                                                                        // Double Tick (Seen)
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>
                                                                    ) : (
                                                                        // Single Tick (Sent)
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
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
                                    {/* Preview Area */}
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
                            // User List View
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
                                            <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600"></div> {/* Status indicator placeholder */}
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
