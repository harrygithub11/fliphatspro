
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Mail, Reply, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ComposeModal } from './ComposeModal';

interface Email {
    id: number;
    subject: string;
    from_name: string;
    from_address: string;
    body_html: string;
    body_text: string;
    created_at: string;
    is_read: number;
}

export function InboxView() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [replyOpen, setReplyOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchInbox();
    }, []);

    const fetchInbox = async () => {
        try {
            const res = await fetch('/api/admin/emails/inbox');
            const data = await res.json();
            if (data.success) {
                setEmails(data.emails);
            }
        } catch (error) {
            console.error('Failed to fetch inbox', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchInbox();
    };

    const filteredEmails = emails.filter(e =>
        e.subject?.toLowerCase().includes(search.toLowerCase()) ||
        e.from_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.from_address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
            {/* Email List */}
            <Card className="col-span-4 flex flex-col h-full">
                <CardHeader className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search inbox..."
                                className="pl-8"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {loading ? (
                            <div className="p-4 text-center text-muted-foreground">Loading...</div>
                        ) : filteredEmails.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                                <Mail className="h-8 w-8 mb-2 opacity-50" />
                                <p>No emails found</p>
                            </div>
                        ) : (
                            filteredEmails.map(email => (
                                <button
                                    key={email.id}
                                    className={`flex flex-col items-start gap-1 p-4 text-left border-b hover:bg-accent transition-colors ${selectedEmail?.id === email.id ? 'bg-accent' : ''} ${!email.is_read ? 'font-semibold bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    onClick={() => setSelectedEmail(email)}
                                >
                                    <div className="flex justify-between w-full mb-1">
                                        <span className="font-medium truncate max-w-[180px]">{email.from_name || email.from_address}</span>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <span className="text-sm truncate w-full">{email.subject || '(No Subject)'}</span>
                                    <p className="text-xs text-muted-foreground line-clamp-2 w-full text-left">
                                        {email.body_text?.substring(0, 100) || 'No preview available'}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </Card>

            {/* Reading Pane */}
            <Card className="col-span-8 flex flex-col h-full">
                {selectedEmail ? (
                    <>
                        <CardHeader className="p-6 border-b flex flex-row justify-between items-start">
                            <div>
                                <CardTitle className="text-xl mb-2">{selectedEmail.subject}</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {(selectedEmail.from_name || selectedEmail.from_address)[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <span className="font-medium text-foreground">{selectedEmail.from_name}</span>
                                        <span className="mx-1">&lt;{selectedEmail.from_address}&gt;</span>
                                        <div className="text-xs">
                                            {new Date(selectedEmail.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={() => setReplyOpen(true)}>
                                    <Reply className="w-4 h-4 mr-2" /> Reply
                                </Button>
                            </div>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-6">
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedEmail.body_html || selectedEmail.body_text?.replace(/\n/g, '<br/>') }}
                            />
                        </ScrollArea>

                        {/* Reply Modal */}
                        <ComposeModal
                            open={replyOpen}
                            onOpenChange={setReplyOpen}
                            defaultTo={selectedEmail.from_address}
                            defaultSubject={`Re: ${selectedEmail.subject}`}
                        />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <Mail className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select an email to read</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
