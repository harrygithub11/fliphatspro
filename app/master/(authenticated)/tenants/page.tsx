'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, MoreVertical, Shield, Archive, Trash2, Power, Users } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: 'active' | 'suspended' | 'archived';
    plan: string;
    user_count: number;
    order_count: number;
    owner_email: string;
    owner_name: string;
    created_at: string;
}

export default function MasterTenantsPage() {
    const { toast } = useToast();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/master/tenants');
            const data = await res.json();
            if (data.success) {
                setTenants(data.tenants);
            }
        } catch (error) {
            console.error('Failed to fetch tenants', error);
            toast({ title: 'Error', description: 'Failed to load tenants', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.owner_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAction = async (tenantId: string, action: string) => {
        try {
            if (action === 'delete') {
                if (!confirm('Are you absolutely sure? This will delete all data permanently.')) return;

                const res = await fetch(`/api/master/tenants/${tenantId}`, { method: 'DELETE' });
                if (res.ok) {
                    toast({ title: 'Success', description: 'Tenant deleted successfully' });
                    fetchTenants();
                } else {
                    throw new Error('Failed to delete');
                }
            }
            else if (action === 'status') {
                const tenant = tenants.find(t => t.id === tenantId);
                const newStatus = tenant?.status === 'active' ? 'suspended' : 'active';

                const res = await fetch(`/api/master/tenants/${tenantId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

                if (res.ok) {
                    toast({ title: 'Success', description: `Tenant ${newStatus === 'active' ? 'activated' : 'suspended'}` });
                    fetchTenants();
                } else {
                    throw new Error('Failed to update status');
                }
            }
            else if (action === 'impersonate') {
                const res = await fetch('/api/master/impersonate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenantId })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    toast({ title: 'Impersonating...', description: 'Redirecting to tenant dashboard' });
                    // Hard redirect to ensure cookie is picked up
                    window.location.href = data.redirectUrl || '/admin/dashboard';
                } else {
                    throw new Error(data.error || 'Failed to impersonate');
                }
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Action failed', variant: 'destructive' });
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin w-4 h-4" /> Loading Tenants...
        </div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
                    <p className="text-zinc-400">Manage all workspaces on the platform</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-8 bg-zinc-900 border-zinc-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b [&_tr]:border-zinc-800">
                                <tr className="border-b transition-colors hover:bg-zinc-900/50 data-[state=selected]:bg-zinc-900">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400">Workspace</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400">Plan</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400">Owner</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-zinc-400">Stats</th>
                                    <th className="h-12 px-4 text-right align-middle font-medium text-zinc-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {filteredTenants.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500">
                                            No tenants found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <tr key={tenant.id} className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{tenant.name}</div>
                                                <div className="text-xs text-zinc-500 font-mono">/{tenant.slug}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge
                                                    variant={tenant.status === 'active' ? 'default' : 'secondary'}
                                                    className={
                                                        tenant.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' :
                                                            tenant.status === 'suspended' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' :
                                                                'bg-zinc-500/10 text-zinc-500'
                                                    }
                                                >
                                                    {tenant.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 capitalize">
                                                    {tenant.plan}
                                                </Badge>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="text-zinc-300">{tenant.owner_name || 'Unknown'}</div>
                                                <div className="text-xs text-zinc-600">{tenant.owner_email}</div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex gap-4 text-xs text-zinc-400">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" /> {tenant.user_count}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{tenant.order_count} Orders</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-800 text-zinc-300">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(tenant.id, 'impersonate')}
                                                            className="focus:bg-zinc-900 focus:text-white cursor-pointer"
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" /> Impersonate Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-zinc-800" />
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(tenant.id, 'status')}
                                                            className="focus:bg-zinc-900 focus:text-white cursor-pointer"
                                                        >
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {tenant.status === 'active' ? 'Suspend Tenant' : 'Activate Tenant'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleAction(tenant.id, 'delete')}
                                                            className="text-red-500 focus:bg-red-950/20 focus:text-red-400 cursor-pointer"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Tenant
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
