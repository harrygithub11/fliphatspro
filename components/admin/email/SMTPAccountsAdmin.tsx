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
    port: number;
    username: string;
    from_name: string;
}

export function SMTPAccountsAdmin() {
    const [accounts, setAccounts] = useState<SMTPAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [testing, setTesting] = useState(false);
    const [skipVerification, setSkipVerification] = useState(false);
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

    const handleProviderChange = (value: string) => {
        let newData = { ...formData, provider: value };
        if (value === 'gmail') {
            newData.host = 'smtp.gmail.com';
            newData.port = '587';
            if (!newData.name) newData.name = 'Gmail Support';
        } else if (value === 'outlook') {
            newData.host = 'smtp.office365.com';
            newData.port = '587';
            if (!newData.name) newData.name = 'Outlook Mail';
        } else if (value === 'sendgrid') {
            newData.host = 'smtp.sendgrid.net';
            newData.port = '587';
            if (!newData.name) newData.name = 'SendGrid';
        }
        setFormData(newData);
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/admin/smtp-accounts', {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
                credentials: 'include'
            });
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

    const [editingId, setEditingId] = useState<number | null>(null);

    const handleEdit = (account: SMTPAccount) => {
        setEditingId(account.id);
        setFormData({
            name: account.name,
            provider: account.provider,
            host: account.host,
            port: account.port ? String(account.port) : '587', // Ensure string for input
            username: account.username,
            password: '', // Don't fill password for security, let them re-enter if updating
            from_email: account.from_email,
            from_name: account.from_name
        });
        setOpen(true);
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({
            name: '',
            provider: 'custom',
            host: '',
            port: '587',
            username: '',
            password: '',
            from_email: '',
            from_name: ''
        });
        setOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTesting(true);

        // Logic split for Create vs Update
        const url = editingId ? `/api/admin/smtp-accounts/${editingId}` : '/api/admin/smtp-accounts';
        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, test_connection: !skipVerification }),
                cache: 'no-store',
                credentials: 'include'
            });

            const data = await res.json();

            if (data.success) {
                toast({ title: 'Success', description: `Account ${editingId ? 'updated' : 'added'} successfully!` });
                setOpen(false);
                fetchAccounts();
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('SMTP Error:', error);
            toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
        } finally {
            setTesting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            await fetch(`/api/admin/smtp-accounts/${id}`, { method: 'DELETE', credentials: 'include' });
            fetchAccounts();
            toast({ title: 'Deleted', description: 'Account removed' });
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to delete' });
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
                        <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" /> Add Account</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit SMTP Account' : 'Add SMTP Account'}</DialogTitle>
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
                                        onValueChange={handleProviderChange}
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
                                        placeholder={editingId ? "Leave blank to keep existing password" : "Enter password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingId}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 pb-2">
                                <input
                                    type="checkbox"
                                    id="skipVerification"
                                    className="rounded border-gray-300"
                                    checked={skipVerification}
                                    onChange={(e) => setSkipVerification(e.target.checked)}
                                />
                                <Label htmlFor="skipVerification" className="text-sm text-muted-foreground font-normal cursor-pointer">
                                    Skip connection verification (Force Save)
                                </Label>
                            </div>

                            <Button type="submit" className="w-full" disabled={testing}>
                                {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (skipVerification ? 'Save Account' : 'Save & Verify Connection')}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map(account => (
                    <Card key={account.id} className="relative group">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(account)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(account.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
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
