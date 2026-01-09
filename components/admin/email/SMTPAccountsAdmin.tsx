'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Server, Trash2, CheckCircle2 } from 'lucide-react';

interface SMTPAccount {
    id: number;
    name: string;
    provider: string;
    from_email: string;
    is_active: number;
    created_at: string;
    host: string;
}

export function SMTPAccountsAdmin() {
    const [accounts, setAccounts] = useState<SMTPAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [testing, setTesting] = useState(false);
    const { toast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        provider: 'custom',
        host: '',
        port: '587',
        username: '',
        password: '',
        from_email: '',
        from_name: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin/smtp-accounts');
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTesting(true);

        try {
            const res = await fetch('/api/admin/smtp-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, test_connection: true })
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: 'Success', description: 'Account added and verified!' });
                setOpen(false);
                fetchAccounts();
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
        } finally {
            setTesting(false);
        }
    };

    const providers = [
        { value: 'gmail', label: 'Gmail (OAuth/App Password)' },
        { value: 'outlook', label: 'Outlook / Office 365' },
        { value: 'sendgrid', label: 'SendGrid' },
        { value: 'ses', label: 'Amazon SES' },
        { value: 'custom', label: 'Custom SMTP' },
    ];

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">SMTP Accounts</h2>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Add Account</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add SMTP Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Account Name</Label>
                                    <Input
                                        placeholder="e.g. Support Gmail"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <Select
                                        value={formData.provider}
                                        onValueChange={val => setFormData({ ...formData, provider: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {providers.map(p => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label>SMTP Host</Label>
                                    <Input
                                        placeholder="smtp.gmail.com"
                                        value={formData.host}
                                        onChange={e => setFormData({ ...formData, host: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Port</Label>
                                    <Input
                                        placeholder="587"
                                        value={formData.port}
                                        onChange={e => setFormData({ ...formData, port: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From Name</Label>
                                    <Input
                                        placeholder="Support Team"
                                        value={formData.from_name}
                                        onChange={e => setFormData({ ...formData, from_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>From Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="support@example.com"
                                        value={formData.from_email}
                                        onChange={e => setFormData({ ...formData, from_email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Username</Label>
                                    <Input
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Password / API Key</Label>
                                    <Input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={testing}>
                                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save & Verify Connection'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map(account => (
                    <Card key={account.id}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                            <Server className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p><strong>Host:</strong> {account.host}</p>
                                <p><strong>From:</strong> {account.from_email}</p>
                                <p className="flex items-center gap-1 mt-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Active
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
