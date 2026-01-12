'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Search, Mail, Reply, Trash2, RefreshCw, Inbox, Send, Archive, FileText, User, ChevronLeft, Loader2, Paperclip } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useComposeEmail } from '@/context/ComposeEmailContext';
import { cn } from '@/lib/utils';

interface Email {
    id: number;
    subject: string;
    from_name: string;
    from_address: string;
    account_email: string;
    customer_name: string;
    avatar_url: string;
    body_html: string;
    body_text: string;
    created_at: string;
    received_at: string;
    is_read: boolean | number;
    recipient_to?: string;
    thread_id?: string;
    thread_count?: number;
    has_attachments: boolean | number;
    attachment_count: number;
    opened_at?: string;
    open_count?: number;
    direction: 'inbound' | 'outbound';
}

interface Account {
    id: number;
    name: string;
    from_email: string;
    unread_count: number;
}

export function InboxView() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
    const [selectedFolder, setSelectedFolder] = useState<string>('INBOX');
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [currentThread, setCurrentThread] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [threadLoading, setThreadLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Global Compose
    const { openCompose } = useComposeEmail();

    const { toast } = useToast();

    useEffect(() => { fetchAccounts(); }, []);
    useEffect(() => { fetchInbox(); }, [selectedAccountId, selectedFolder]);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin/smtp-accounts');
            const data = await res.json();
            if (data.success) setAccounts(data.accounts);
        } catch (error) { console.error('Failed to fetch accounts', error); }
    };

    const fetchInbox = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                folder: selectedFolder,
                accountId: selectedAccountId,
                search: search
            });
            const res = await fetch(`/api/admin/emails/inbox?${params}`);
            const data = await res.json();
            if (data.success) setEmails(data.emails || []);
        } catch (error) {
            toast({ title: 'Sync Error', description: 'Failed to sync emails.', variant: 'destructive' });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInbox();
    };

    const fetchThread = async (threadId: string) => {
        setThreadLoading(true);
        try {
            const res = await fetch(`/api/admin/emails/thread/${threadId}`);
            const data = await res.json();
            if (data.success) setCurrentThread(data.emails);
        } catch (error) { console.error('Thread fetch failed', error); }
        finally { setThreadLoading(false); }
    };

    const handleEmailClick = (email: Email) => {
        setSelectedEmail(email);
        if (email.thread_id) fetchThread(email.thread_id);
        else setCurrentThread([email]);

        if (!email.is_read) {
            setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e));
            fetch(`/api/admin/emails/${email.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
            });
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] w-full rounded-lg border bg-background shadow-sm overflow-hidden">
            {/* 1. Sidebar */}
            <div className="w-[200px] border-r bg-muted/10 flex flex-col hidden md:flex">
                <div className="p-4">
                    <Button onClick={() => openCompose()} className="w-full gap-2 shadow-sm" size="sm">
                        <Send className="h-4 w-4" /> Compose
                    </Button>
                </div>
                <ScrollArea className="flex-1 px-2">
                    <div className="space-y-1">
                        {[
                            { id: 'INBOX', icon: Inbox, label: 'Inbox' },
                            { id: 'SENT', icon: Send, label: 'Sent' },
                            { id: 'TRASH', icon: Trash2, label: 'Trash' },
                            { id: 'all', icon: Mail, label: 'All Mail' },
                        ].map((f) => (
                            <Button
                                key={f.id}
                                variant="ghost"
                                size="sm"
                                className={cn("w-full justify-start font-medium h-9", selectedFolder === f.id ? "bg-accent text-accent-foreground" : "text-muted-foreground")}
                                onClick={() => setSelectedFolder(f.id)}
                            >
                                <f.icon className="mr-2 h-4 w-4" /> {f.label}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* 2. List */}
            <div className="w-[320px] border-r flex flex-col">
                <div className="p-3 border-b bg-muted/5 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-8 text-xs bg-background"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchInbox()}
                        />
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh}>
                        <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="divide-y">
                        {loading ? <div className="p-8 text-center text-xs animate-pulse">Syncing...</div> : emails.map(email => (
                            <div
                                key={email.id}
                                className={cn(
                                    "p-4 cursor-pointer hover:bg-muted/30 transition-colors border-l-2",
                                    selectedEmail?.id === email.id ? "bg-muted border-l-primary" : "border-l-transparent",
                                    !email.is_read ? "bg-primary/5" : "opacity-70"
                                )}
                                onClick={() => handleEmailClick(email)}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={cn("text-xs truncate max-w-[150px]", !email.is_read ? "font-bold" : "font-medium")}>
                                        {email.direction === 'outbound' ? `To: ${email.from_name || email.from_address}` : (email.from_name || email.from_address)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {formatDistanceToNow(new Date(email.received_at || email.created_at), { addSuffix: false })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <span className={cn("text-[11px] truncate flex-1", !email.is_read ? "font-semibold" : "text-muted-foreground")}>
                                        {email.subject || '(No Subject)'}
                                    </span>
                                    {email.has_attachments ? <Paperclip className="h-3 w-3 text-muted-foreground" /> : null}
                                    {email.direction === 'outbound' && email.opened_at && <Badge variant="outline" className="text-[9px] px-1 h-3 border-green-500 text-green-600">Opened</Badge>}
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                                    {email.body_text?.substring(0, 60)}
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* 3. Pane */}
            <div className="flex-1 flex flex-col bg-background overflow-hidden">
                {selectedEmail ? (
                    <>
                        <div className="p-6 border-b flex justify-between">
                            <div className="flex gap-4">
                                <Avatar className="h-10 w-10 border shadow-sm">
                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                        {(selectedEmail.from_name || '??').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-lg font-bold mb-1">{selectedEmail.subject}</h2>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="font-semibold text-foreground">{selectedEmail.from_name}</span>
                                        <span>&lt;{selectedEmail.from_address}&gt;</span>
                                        {selectedEmail.direction === 'outbound' && selectedEmail.opened_at && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                Opened {selectedEmail.open_count}x
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => openCompose({
                                to: selectedEmail.from_address,
                                subject: `Re: ${selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject.substring(3).trim() : selectedEmail.subject}`
                            })}>
                                <Reply className="h-4 w-4 mr-2" /> Reply
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-8">
                            <div className="max-w-3xl mx-auto space-y-8">
                                {currentThread.map(e => (
                                    <div key={e.id} className="rounded-xl border shadow-sm bg-card p-6 overflow-hidden">
                                        <div className="flex justify-between text-[11px] text-muted-foreground mb-4 border-b pb-2">
                                            <span>{new Date(e.received_at || e.created_at).toLocaleString()}</span>
                                            {e.direction === 'outbound' && (
                                                <span className="flex items-center gap-1">
                                                    {e.opened_at ? `Opened at ${new Date(e.opened_at).toLocaleTimeString()}` : 'Unopened'}
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: e.body_html || e.body_text?.replace(/\n/g, '<br/>') }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        {/* ComposeModal Removed - Used globally via Context */}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <Mail className="h-16 w-16 mb-4 opacity-10" />
                        <p className="text-sm font-medium">Select an email to start reading</p>
                    </div>
                )}
            </div>
        </div>
    );
}
