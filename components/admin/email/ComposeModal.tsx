'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Paperclip, Send } from 'lucide-react';

interface ComposeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialTo?: string;
    customerId?: number;
}

export function ComposeModal({ open, onOpenChange, initialTo = '', customerId }: ComposeModalProps) {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const [accounts, setAccounts] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        to: initialTo,
        subject: '',
        body: '',
        smtp_account_id: ''
    });

    useEffect(() => {
        if (open) {
            // Load SMTP accounts
            fetch('/api/admin/smtp-accounts')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.accounts.length > 0) {
                        setAccounts(data.accounts);
                        // Default to first account
                        setFormData(prev => ({ ...prev, smtp_account_id: String(data.accounts[0].id) }));
                    }
                });
        }
    }, [open]);

    useEffect(() => {
        if (initialTo) setFormData(prev => ({ ...prev, to: initialTo }));
    }, [initialTo]);

    const handleSend = async () => {
        if (!formData.to || !formData.subject || !formData.smtp_account_id) {
            toast({ title: "Validation Error", description: "Please fill all required fields", variant: "destructive" });
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/admin/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipients: { to: [{ email: formData.to }] }, // Simplified for MVP
                    subject: formData.subject,
                    body_html: `<p>${formData.body}</p>`, // Wrap in p for now, assume RTE later
                    body_text: formData.body,
                    smtp_account_id: parseInt(formData.smtp_account_id),
                    related_customer_id: customerId
                })
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: "Email Queued", description: "Your email is being sent." });
                onOpenChange(false);
                setFormData({ ...formData, subject: '', body: '' }); // Reset
            } else {
                toast({ title: "Error", description: data.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "System Error", description: "Failed to send email", variant: "destructive" });
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Compose Email</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>From</Label>
                            <Select
                                value={formData.smtp_account_id}
                                onValueChange={val => setFormData({ ...formData, smtp_account_id: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={String(acc.id)}>{acc.name} ({acc.from_email})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>To</Label>
                            <Input
                                value={formData.to}
                                onChange={e => setFormData({ ...formData, to: e.target.value })}
                                placeholder="recipient@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                            value={formData.subject}
                            onChange={e => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Email Subject"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            className="min-h-[300px]"
                            placeholder="Write your message..."
                            value={formData.body}
                            onChange={e => setFormData({ ...formData, body: e.target.value })}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <div className="flex justify-between w-full items-center">
                        <Button variant="ghost" size="sm">
                            <Paperclip className="w-4 h-4 mr-2" /> Attach Files
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleSend} disabled={sending}>
                                {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                Send Email
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
