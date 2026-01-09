'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ComposeModal } from './ComposeModal';
import { Mail, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function EmailsTab() {
    const [emails, setEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [composeOpen, setComposeOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchEmails();
    }, [filterStatus, composeOpen]); // Refetch when modal closes (new email sent)

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const url = filterStatus
                ? `/api/admin/emails?status=${filterStatus}`
                : '/api/admin/emails';

            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setEmails(data.emails);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent': return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Sent</Badge>;
            case 'queued': return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Queued</Badge>;
            case 'failed': return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Failed</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button
                        variant={filterStatus === null ? 'default' : 'outline'}
                        onClick={() => setFilterStatus(null)}
                    >
                        All
                    </Button>
                    <Button
                        variant={filterStatus === 'sent' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('sent')}
                    >
                        Sent
                    </Button>
                    <Button
                        variant={filterStatus === 'queued' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('queued')}
                    >
                        Queued
                    </Button>
                    <Button
                        variant={filterStatus === 'failed' ? 'default' : 'outline'}
                        onClick={() => setFilterStatus('failed')}
                    >
                        Failed
                    </Button>
                </div>

                <Button onClick={() => setComposeOpen(true)}>
                    <Mail className="w-4 h-4 mr-2" /> Compose Email
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Email Log</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8">Loading emails...</div>
                    ) : (
                        <div className="space-y-4">
                            {emails.length === 0 && <div className="text-center text-muted-foreground py-8">No emails found</div>}

                            {emails.map((email) => (
                                <div key={email.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">
                                                {email.subject || '(No Subject)'}
                                            </span>
                                            {getStatusBadge(email.status)}
                                        </div>
                                        <div className="text-xs text-muted-foreground flex gap-4">
                                            <span>To: {JSON.parse(email.recipient_to || '[]').map((r: any) => r.email).join(', ')}</span>
                                            <span>From: {email.smtp_account_name}</span>
                                        </div>
                                        {email.error_message && (
                                            <div className="text-xs text-red-500 mt-1">
                                                Error: {email.error_message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-zinc-400">
                                        {formatDistanceToNow(new Date(email.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <ComposeModal
                open={composeOpen}
                onOpenChange={setComposeOpen}
            />
        </div>
    );
}
