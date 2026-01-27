'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight, Plus, Loader2 } from 'lucide-react';

interface TenantMembership {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    tenantPlan: string;
    role: string;
}

export default function SelectTenantPage() {
    const router = useRouter();
    const [tenants, setTenants] = useState<TenantMembership[]>([]);
    const [loading, setLoading] = useState(true);
    const [selecting, setSelecting] = useState<string | null>(null);

    useEffect(() => {
        fetchTenants();
    }, []);

    async function fetchTenants() {
        try {
            const response = await fetch('/api/admin/tenants/my-tenants');
            if (response.ok) {
                const data = await response.json();
                setTenants(data.tenants || []);

                // If user only has one tenant, auto-select it
                if (data.tenants?.length === 1) {
                    await selectTenant(data.tenants[0].tenantId);
                }
            }
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
        } finally {
            setLoading(false);
        }
    }

    async function selectTenant(tenantId: string) {
        setSelecting(tenantId);
        try {
            const response = await fetch('/api/admin/tenants/switch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId }),
            });

            if (response.ok) {
                const data = await response.json();

                // Force full reload/redirect to ensure subdomain and middleware pick it up
                // Use CRM subdomain explicitly if possible, or relative /dashboard if middleware handles it
                // Given previous issues, strict CRM subdomain construction is safest for localhost

                const host = window.location.hostname;
                const protocol = window.location.protocol;
                const port = window.location.port ? `:${window.location.port}` : '';

                let baseDomain = 'fliphats.com';
                if (host.includes('localhost')) {
                    baseDomain = 'localhost';
                } else {
                    const parts = host.split('.');
                    if (parts.length > 2) {
                        baseDomain = parts.slice(1).join('.');
                    } else {
                        baseDomain = host;
                    }
                }

                // If we are on account.localhost, we want to go to crm.localhost
                // If we are on account.fliphats.com, we want crm.fliphats.com

                // However, middleware now has a safety net for /dashboard
                // But let's be explicit to avoid the extra redirect hop
                const crmBase = `${protocol}//crm.${baseDomain}${port}`;
                const crmDashboard = `${crmBase}/dashboard`;

                // HANDOFF LOGIC: Use token transfer to ensure cookie is set on target domain
                // Critical for local dev and cross-subdomain transitions
                if (data.token) {
                    window.location.href = `${crmBase}/api/auth/handoff?token=${data.token}&redirect=/dashboard`;
                } else {
                    window.location.href = crmDashboard;
                }
            } else {
                console.error('Failed to switch tenant');
                setSelecting(null);
            }
        } catch (error) {
            console.error('Error switching tenant:', error);
            setSelecting(null);
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'admin':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'member':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'viewer':
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getPlanBadge = (plan: string) => {
        const colors: Record<string, string> = {
            free: 'bg-gray-500/10 text-gray-400',
            starter: 'bg-blue-500/10 text-blue-400',
            professional: 'bg-indigo-500/10 text-indigo-400',
            enterprise: 'bg-amber-500/10 text-amber-400',
        };
        return colors[plan] || colors.free;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-400">Loading your workspaces...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                        <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Select Workspace</h1>
                    <p className="text-gray-400">Choose a workspace to continue</p>
                </div>

                {/* Tenant List */}
                <div className="space-y-3">
                    {tenants.map((tenant) => (
                        <button
                            key={tenant.tenantId}
                            onClick={() => selectTenant(tenant.tenantId)}
                            disabled={selecting !== null}
                            className={`
                                w-full p-4 rounded-xl border transition-all duration-200
                                ${selecting === tenant.tenantId
                                    ? 'bg-blue-500/10 border-blue-500/50'
                                    : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800 hover:border-gray-600'
                                }
                                disabled:opacity-50 disabled:cursor-not-allowed
                                group
                            `}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                                        <span className="text-xl font-bold text-blue-400">
                                            {tenant.tenantName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {tenant.tenantName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRoleBadgeColor(tenant.role)}`}>
                                                {tenant.role}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPlanBadge(tenant.tenantPlan)}`}>
                                                {tenant.tenantPlan}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selecting === tenant.tenantId ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                    ) : (
                                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}

                    {tenants.length === 0 && (
                        <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                            <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-300 mb-2">No workspaces yet</h3>
                            <p className="text-gray-500 mb-6">
                                You haven't been added to any workspace yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Create New Workspace */}
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                    <button
                        onClick={() => router.push('/admin/tenants/create')}
                        className="w-full p-4 rounded-xl border border-dashed border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all duration-200 group"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Plus className="h-5 w-5 text-gray-500 group-hover:text-blue-400" />
                            <span className="text-gray-400 group-hover:text-blue-400 font-medium">
                                Create New Workspace
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
