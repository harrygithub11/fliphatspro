'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronDown, Check, Plus, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSlugSafe } from '@/lib/slug-context';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Tenant {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantPlan: string;
    tenantLogo?: string | null;
    role: string;
}

interface TenantSwitcherProps {
    collapsed?: boolean;
}

export function TenantSwitcher({ collapsed }: TenantSwitcherProps) {
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const slugContext = useSlugSafe();
    const slug = slugContext?.slug || '';

    // Create Tenant State
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSlug, setNewSlug] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchTenants();
    }, []);

    async function fetchTenants() {
        try {
            const response = await fetch('/api/admin/tenants/my-tenants');
            if (response.ok) {
                const data = await response.json();
                setTenants(data.tenants || []);
                setCurrentTenantId(data.currentTenantId || null);
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    }

    async function switchTenant(tenantId: string) {
        if (tenantId === currentTenantId) return;

        setSwitching(true);
        try {
            const response = await fetch('/api/admin/tenants/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId }),
            });

            if (response.ok) {
                const data = await response.json();
                setCurrentTenantId(tenantId);

                // Find the new tenant's slug
                const newTenant = tenants.find(t => t.tenantId === tenantId);
                if (newTenant?.tenantSlug) {
                    // Navigate to the new tenant's dashboard with slug in URL
                    window.location.href = `/${newTenant.tenantSlug}/dashboard`;
                } else {
                    // Fallback to reload
                    window.location.reload();
                }
            }
        } catch (error) {
            console.error('Error switching tenant:', error);
        } finally {
            setSwitching(false);
        }
    }

    const handleCreate = async () => {
        if (!newName || !newSlug) return;
        setCreating(true);
        try {
            const res = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, slug: newSlug })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setCreateOpen(false);
                setNewName('');
                setNewSlug('');
                // Switch to new tenant
                await switchTenant(data.tenant.id);
            } else {
                alert(data.error || "Failed to create workspace");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred");
        } finally {
            setCreating(false);
        }
    };

    const handleNameChange = (val: string) => {
        setNewName(val);
        // Auto-slug
        setNewSlug(val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
    };

    const currentTenant = tenants.find(t => t.tenantId === currentTenantId);

    const getPlanColor = (plan: string) => {
        switch (plan) {
            case 'enterprise': return 'text-amber-500';
            case 'professional': return 'text-[#FF5941]';
            case 'starter': return 'text-blue-500';
            default: return 'text-zinc-500';
        }
    };

    if (loading || tenants.length === 0) {
        // Loading state skeleton
        return (
            <div className={cn("flex items-center gap-3 h-10 rounded-xl animate-pulse bg-zinc-100 dark:bg-zinc-800", collapsed ? "w-10 p-0" : "w-full px-2")}></div>
        );
    }

    // Common trigger content for consistency
    const TriggerContent = () => (
        <div
            className={cn(
                "w-full flex items-center gap-3 rounded-xl transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer group",
                collapsed ? "justify-center p-0 h-10 w-10" : "px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md"
            )}
        >
            <div className="size-9 rounded-lg bg-gradient-to-br from-[#FF5941] to-[#ff8c7a] flex items-center justify-center shrink-0 shadow-sm text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {/* Use custom logo if available */}
                {currentTenant?.tenantLogo ? (
                    <img src={currentTenant.tenantLogo} alt={currentTenant.tenantName} className="w-full h-full object-cover" />
                ) : currentTenant?.tenantName.toLowerCase().includes('fliphats') ? (
                    <img src="/Photos/logo.png" alt="Logo" className="w-5 h-5 object-contain invert brightness-0" />
                ) : (
                    <span className="text-sm font-bold">
                        {currentTenant?.tenantName.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            {!collapsed && (
                <>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate leading-none mb-1">{currentTenant?.tenantName}</p>
                        <div className="flex items-center gap-1.5">
                            <span className={cn("text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1", getPlanColor(currentTenant?.tenantPlan || ''))}>
                                {currentTenant?.tenantPlan}
                                {currentTenant?.tenantPlan === 'professional' && <Sparkles className="w-2.5 h-2.5" />}
                            </span>
                        </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
                </>
            )}
        </div>
    );

    // If only one tenant, show clickable display with settings option
    if (tenants.length === 1) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild className="outline-none">
                        <button className="w-full"><TriggerContent /></button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="start" className="w-64 p-2 rounded-xl shadow-xl border-zinc-200 dark:border-zinc-800">
                        <div className="px-2 py-2 mb-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                            <p className="text-sm font-semibold">{currentTenant?.tenantName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{currentTenant?.tenantPlan} Plan · {currentTenant?.role}</p>
                        </div>

                        <DropdownMenuItem onClick={() => router.push(slug ? `/${slug}/settings` : '/settings')} className="cursor-pointer rounded-lg">
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </DropdownMenuItem>

                        <DropdownMenuItem onClick={() => router.push(slug ? `/${slug}/team` : '/team')} className="cursor-pointer rounded-lg">
                            <Building2 className="w-4 h-4 mr-2" /> Team Management
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-1" />

                        <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer rounded-lg text-[#FF5941] focus:text-[#FF5941]">
                            <Plus className="w-4 h-4 mr-2" /> New Workspace
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Workspace</DialogTitle>
                            <DialogDescription>Create a separate environment for a new business or project.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Workspace Name</Label>
                                <Input placeholder="e.g. Acme Corp" value={newName} onChange={e => handleNameChange(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Workspace URL</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground text-sm">app.fliphats.com/</span>
                                    <Input placeholder="acme-corp" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="font-mono text-sm" />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={!newName || !newSlug || creating}>
                                {creating ? 'Creating...' : 'Create Workspace'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }

    // Multiple tenants - show dropdown
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={switching} className="outline-none">
                    <button className="w-full"><TriggerContent /></button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-72 p-2 rounded-xl shadow-xl border-zinc-200 dark:border-zinc-800">
                    <div className="px-2 py-2">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Switch Workspace</p>
                    </div>

                    <div className="space-y-1 mb-2">
                        {tenants.map((tenant) => (
                            <DropdownMenuItem
                                key={tenant.tenantId}
                                onClick={() => switchTenant(tenant.tenantId)}
                                className={cn(
                                    "cursor-pointer rounded-lg p-2 focus:bg-zinc-100 dark:focus:bg-zinc-800",
                                    tenant.tenantId === currentTenantId && "bg-zinc-50 dark:bg-zinc-800/50"
                                )}
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700",
                                        tenant.tenantId === currentTenantId ? "bg-white dark:bg-zinc-700 shadow-sm" : "bg-zinc-100 dark:bg-zinc-800"
                                    )}>
                                        {tenant.tenantId === currentTenantId ? (
                                            <Check className="w-4 h-4 text-[#FF5941]" />
                                        ) : (
                                            <span className="text-sm font-bold text-zinc-500">
                                                {tenant.tenantName.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-medium truncate", tenant.tenantId === currentTenantId ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400")}>
                                            {tenant.tenantName}
                                        </p>
                                        <p className="text-xs text-muted-foreground capitalize">{tenant.role}</p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>

                    <DropdownMenuSeparator className="my-1" />

                    <DropdownMenuItem onClick={() => setCreateOpen(true)} className="cursor-pointer rounded-lg font-medium">
                        <Plus className="w-4 h-4 mr-2" /> Create Workspace
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => router.push(slug ? `/${slug}/settings` : '/settings')} className="cursor-pointer rounded-lg font-medium">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Workspace</DialogTitle>
                        <DialogDescription>Create a separate environment for a new business or project.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Workspace Name</Label>
                            <Input placeholder="e.g. Acme Corp" value={newName} onChange={e => handleNameChange(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Workspace URL</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">app.fliphats.com/</span>
                                <Input placeholder="acme-corp" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="font-mono text-sm" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newName || !newSlug || creating}>
                            {creating ? 'Creating...' : 'Create Workspace'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
