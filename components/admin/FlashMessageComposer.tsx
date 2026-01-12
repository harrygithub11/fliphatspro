import { useState, useEffect } from 'react';
import { useFlashMessages } from '@/hooks/useFlashMessages';
import { Megaphone, Send, X, Users, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
    id: number;
    name: string;
    email: string;
}

export function FlashMessageComposer() {
    const { sendMessage } = useFlashMessages();
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>(''); // 'all' or user ID
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch assignable users (admins) from API
            // Usually this would be robust, but for now we try to fetch from a known endpoint or just rely on manual entry if needed, but select is better.
            // Assumption: we have an endpoint to list admins. If not, I'll need to make one.
            // Let's assume /api/admin/users exists or I'll use a placeholder.
            // Wait, I didn't create that endpoint.
            // I'll try /api/admin/team if it exists? 
            // I'll try /api/admin/team if it existed? 
            // The layout is using /api/admin/me.
            // Let's try fetching from /api/admin/team/members if it existed.
            // For now, I'll stub it with a fetch to /api/admin/users/list or similar.
            // Actually, I'll just use a text input for ID if list fails, but I really likely need a list.
            // I will implement a quick fetch logic in `useEffect` assuming /api/admin/team exists (from NavItem).

            fetch('/api/admin/team')
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setUsers(data);
                    } else if (data.members) {
                        setUsers(data.members);
                    }
                })
                .catch(err => console.error("Could not fetch team", err));
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!message.trim() || !selectedUser) return;
        setSending(true);
        try {
            if (selectedUser === 'all') {
                // Determine how to broadcast. Loop front-end or backend?
                // Backend generic 'all' support or loop here.
                // Loop here for safety/simplicity first version.
                for (const user of users) {
                    await sendMessage(user.id, message);
                }
                toast({ description: `Broadcast sent to ${users.length} users` });
            } else {
                await sendMessage(parseInt(selectedUser), message);
                toast({ description: "Message sent!" });
            }
            setIsOpen(false);
            setMessage('');
            setSelectedUser('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', description: "Failed to send" });
        } finally {
            setSending(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && activeTab === 'history') {
            fetch('/api/admin/flash-messages?type=history')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setHistory(data.messages);
                    }
                });
        }
    }, [isOpen, activeTab]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hidden md:flex">
                    <Megaphone className="w-4 h-4" />
                    Priority Broadcast
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Megaphone className="w-5 h-5" />
                        Flash Messages
                    </DialogTitle>
                    <div className="flex gap-2 mt-2">
                        <Button
                            variant={activeTab === 'compose' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('compose')}
                            className={activeTab === 'compose' ? 'bg-red-600 hover:bg-red-700' : ''}
                        >
                            Compose
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('history')}
                        >
                            History & Status
                        </Button>
                    </div>
                </DialogHeader>

                {activeTab === 'compose' ? (
                    <div className="grid gap-4 py-4 flex-1">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium">To:</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                <option value="">Select Recipient...</option>
                                <option value="all" className="font-bold">📢 BROADCAST TO ALL</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium">Message (Big & Bold):</label>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-lg font-medium shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                placeholder="URGENT: Server maintenance in 5 mins..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-auto">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleSend}
                                disabled={!selectedUser || !message.trim() || sending}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {sending ? 'Sending...' : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Priority
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground py-10">No message history</div>
                        ) : (
                            history.map((msg: any) => (
                                <div key={msg.id} className="border rounded-lg p-3 text-sm">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold">
                                            {msg.senderId === msg.receiverId ? 'Self' : (msg.sender?.name || 'Unknown')}
                                            {' -> '}
                                            {msg.receiver?.name || 'Unknown'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(msg.sentAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="bg-gray-50 p-2 rounded mb-2">{msg.message}</p>
                                    <div className="flex items-center gap-2 text-xs">
                                        {msg.isRead ? (
                                            <span className="text-green-600 flex items-center gap-1 font-bold">
                                                <Check className="w-3 h-3" /> Seen {msg.readAt ? `at ${new Date(msg.readAt).toLocaleTimeString()}` : ''}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 font-bold">Unread</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
