import { useState, useEffect, useRef } from 'react';
import { useFlashMessages, FlashMessage } from '@/hooks/useFlashMessages';
import { MessageSquare, X, Send, User, MoreVertical, Minimize2 } from 'lucide-react';
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
    const { sendMessage, fetchMessages, unreadChatMessages } = useFlashMessages();
    const [isOpen, setIsOpen] = useState(false);
    const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
    const [users, setUsers] = useState<ChatUser[]>([]);
    const [messages, setMessages] = useState<FlashMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const hasUnread = unreadChatMessages.length > 0;

    // Fetch team members on mount
    useEffect(() => {
        if (isOpen) {
            fetch('/api/admin/team')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setUsers(data);
                    } else if (data.members && Array.isArray(data.members)) {
                        setUsers(data.members);
                    }
                })
                .catch(() => { });
        }
    }, [isOpen]);

    // Poll messages when chat is active with a user
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isOpen && activeUser) {
            const load = async () => {
                const msgs = await fetchMessages('chat', activeUser.id);
                setMessages(msgs);
            };
            load();
            interval = setInterval(load, 3000); // Poll every 3s for chat
        }
        return () => clearInterval(interval);
    }, [isOpen, activeUser, fetchMessages]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || !activeUser) return;
        setLoading(true);
        try {
            // Optimistic update? No, safer to wait for poll or response
            await sendMessage(activeUser.id, inputText, undefined, 'chat');
            setInputText('');
            // Refresh immediately
            const msgs = await fetchMessages('chat', activeUser.id);
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
                                            return (
                                                <div key={msg.id} className={cn("flex", isIncoming ? "justify-start" : "justify-end")}>
                                                    <div className={cn(
                                                        "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                        isIncoming
                                                            ? "bg-white dark:bg-zinc-800 text-foreground rounded-tl-none border border-zinc-200 dark:border-zinc-700"
                                                            : "bg-red-600 text-white rounded-tr-none"
                                                    )}>
                                                        {msg.message}
                                                        <span className={cn("text-[10px] block mt-1 text-right opacity-70", isIncoming ? "text-muted-foreground" : "text-red-100")}>
                                                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                                    <form
                                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                        className="flex gap-2 items-center"
                                    >
                                        <input
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
                                        />
                                        <Button
                                            type="submit"
                                            size="icon"
                                            disabled={!inputText.trim() || loading}
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
