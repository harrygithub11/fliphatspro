'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Filter, DollarSign, TrendingUp, Target, Trophy,
    ChevronDown, MoreVertical, User, Calendar, Building2, Phone,
    Edit, Trash2, X, Check, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

interface Deal {
    id: number;
    title: string;
    description: string;
    amount: number;
    currency: string;
    stage: string;
    probability: number;
    expected_close_date: string;
    status: 'open' | 'won' | 'lost';
    customer_id: number;
    customer_name: string;
    customer_email: string;
    customer_company: string;
    company_id: number;
    company_name: string;
    owner_name: string;
    created_at: string;
}

interface StageTotals {
    stage: string;
    count: number;
    total_value: number;
}

interface Stats {
    total_deals: number;
    open_deals: number;
    won_deals: number;
    lost_deals: number;
    pipeline_value: number;
    won_value: number;
}

const STAGES = [
    { id: 'lead', name: 'Lead', color: '#6B7280', probability: 10 },
    { id: 'qualified', name: 'Qualified', color: '#3B82F6', probability: 25 },
    { id: 'proposal', name: 'Proposal', color: '#8B5CF6', probability: 50 },
    { id: 'negotiation', name: 'Negotiation', color: '#F59E0B', probability: 75 },
    { id: 'closed_won', name: 'Closed Won', color: '#10B981', probability: 100 },
    { id: 'closed_lost', name: 'Closed Lost', color: '#EF4444', probability: 0 },
];

export default function DealsPage() {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [stageTotals, setStageTotals] = useState<StageTotals[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
    const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
    const { toast } = useToast();

    const loadDeals = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/deals');
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals || []);
                setStageTotals(data.stageTotals || []);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load deals:', error);
            toast({ title: 'Error', description: 'Failed to load deals', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadDeals();
    }, [loadDeals]);

    const getStageDeals = (stageId: string) => {
        return deals.filter(d => d.stage === stageId && d.status === 'open');
    };

    const getStageTotal = (stageId: string) => {
        const stage = stageTotals.find(s => s.stage === stageId);
        return stage?.total_value || 0;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleMoveDeal = async (dealId: number, newStage: string) => {
        try {
            const newStatus = newStage === 'closed_won' ? 'won' : newStage === 'closed_lost' ? 'lost' : 'open';

            const res = await fetch('/api/admin/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: dealId, stage: newStage, status: newStatus })
            });

            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Deal updated' });
                loadDeals();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update deal', variant: 'destructive' });
        }
    };

    const filteredDeals = deals.filter(d =>
        !searchQuery ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.customer_company?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Deals Pipeline</h1>
                    <p className="text-muted-foreground">Track and manage your sales opportunities</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Deal
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Open Deals</p>
                            <p className="text-2xl font-bold">{stats?.open_deals || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pipeline Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats?.pipeline_value || 0)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Trophy className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Won</p>
                            <p className="text-2xl font-bold">{stats?.won_deals || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Won Value</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats?.won_value || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search deals..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 border rounded-lg p-1">
                    <Button
                        variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('pipeline')}
                    >
                        Pipeline
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        List
                    </Button>
                </div>
            </div>

            {/* Pipeline View */}
            {viewMode === 'pipeline' && (
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {STAGES.filter(s => s.id !== 'closed_lost').map((stage) => (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 w-72 bg-gray-50 rounded-xl p-4"
                        >
                            {/* Stage Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <h3 className="font-semibold">{stage.name}</h3>
                                    <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                                        {getStageDeals(stage.id).length}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                                {formatCurrency(getStageTotal(stage.id))}
                            </p>

                            {/* Deal Cards */}
                            <div className="space-y-3">
                                {getStageDeals(stage.id).map((deal) => (
                                    <div
                                        key={deal.id}
                                        className="bg-white rounded-lg p-4 shadow-sm border cursor-pointer hover:shadow-md transition-all group"
                                        onClick={() => setSelectedDeal(deal)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-sm">{deal.title}</h4>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                            >
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <p className="text-lg font-bold text-primary mb-2">
                                            {formatCurrency(deal.amount)}
                                        </p>
                                        {deal.customer_name && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Building2 className="w-3 h-3" />
                                                <span>{deal.customer_company || deal.customer_name}</span>
                                            </div>
                                        )}
                                        {deal.expected_close_date && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {/* Quick Move Buttons */}
                                        <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {stage.id !== 'closed_won' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs text-green-600 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMoveDeal(deal.id, 'closed_won');
                                                    }}
                                                >
                                                    <Check className="w-3 h-3 mr-1" /> Won
                                                </Button>
                                            )}
                                            {STAGES.findIndex(s => s.id === stage.id) < STAGES.length - 2 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const nextStage = STAGES[STAGES.findIndex(s => s.id === stage.id) + 1];
                                                        handleMoveDeal(deal.id, nextStage.id);
                                                    }}
                                                >
                                                    <ArrowRight className="w-3 h-3 mr-1" /> Next
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {getStageDeals(stage.id).length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No deals
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-xl border">
                    <table className="w-full">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="text-left p-4 text-sm font-medium">Deal</th>
                                <th className="text-left p-4 text-sm font-medium">Customer</th>
                                <th className="text-left p-4 text-sm font-medium">Value</th>
                                <th className="text-left p-4 text-sm font-medium">Stage</th>
                                <th className="text-left p-4 text-sm font-medium">Close Date</th>
                                <th className="text-left p-4 text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeals.map((deal) => (
                                <tr key={deal.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium">{deal.title}</div>
                                        <div className="text-xs text-gray-500">{deal.owner_name}</div>
                                    </td>
                                    <td className="p-4">
                                        <div>{deal.customer_name || '-'}</div>
                                        <div className="text-xs text-gray-500">{deal.customer_company}</div>
                                    </td>
                                    <td className="p-4 font-semibold">{formatCurrency(deal.amount)}</td>
                                    <td className="p-4">
                                        <span
                                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                                            style={{ backgroundColor: STAGES.find(s => s.id === deal.stage)?.color || '#6B7280' }}
                                        >
                                            {STAGES.find(s => s.id === deal.stage)?.name || deal.stage}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {deal.expected_close_date
                                            ? new Date(deal.expected_close_date).toLocaleDateString()
                                            : '-'}
                                    </td>
                                    <td className="p-4">
                                        <Button variant="ghost" size="sm" onClick={() => setSelectedDeal(deal)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {filteredDeals.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No deals found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Deal Modal */}
            {showCreateModal && (
                <CreateDealModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadDeals();
                    }}
                />
            )}

            {/* Deal Detail Modal */}
            {selectedDeal && (
                <DealDetailModal
                    deal={selectedDeal}
                    onClose={() => setSelectedDeal(null)}
                    onUpdate={() => {
                        setSelectedDeal(null);
                        loadDeals();
                    }}
                />
            )}
        </div>
    );
}

// Create Deal Modal Component
function CreateDealModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [companies, setCompanies] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [form, setForm] = useState({
        title: '',
        amount: '',
        stage: 'lead',
        expected_close_date: '',
        description: '',
        company_id: '',
        customer_id: ''
    });
    const { toast } = useToast();

    // Load companies and customers on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const [compRes, custRes] = await Promise.all([
                    fetch('/api/admin/companies'),
                    fetch('/api/admin/leads')
                ]);
                const [compData, custData] = await Promise.all([compRes.json(), custRes.json()]);
                if (compData.success) setCompanies(compData.companies || []);
                if (custData.success) setCustomers(custData.customers || custData.leads || []);
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        };
        loadData();
    }, []);

    // Load company contacts when company is selected
    useEffect(() => {
        if (form.company_id) {
            const loadCompanyContacts = async () => {
                try {
                    const res = await fetch(`/api/admin/companies/${form.company_id}`);
                    const data = await res.json();
                    if (data.success && data.contacts) {
                        // Merge company contacts with available customers
                        const companyContacts = data.contacts;
                        setCustomers(prev => {
                            // Add company contacts if not already in the list
                            const existingIds = prev.map((c: any) => c.id);
                            const newContacts = companyContacts.filter((c: any) => !existingIds.includes(c.id));
                            return [...newContacts, ...prev];
                        });
                    }
                } catch (error) {
                    console.error('Failed to load company contacts:', error);
                }
            };
            loadCompanyContacts();
        }
    }, [form.company_id]);

    // When company is selected, filter customers by company_id
    const filteredCustomers = form.company_id
        ? customers.filter((c: any) => c.company_id === parseInt(form.company_id) || !c.company_id)
        : customers;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) {
            toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: form.title,
                    amount: parseFloat(form.amount) || 0,
                    stage: form.stage,
                    expected_close_date: form.expected_close_date || null,
                    description: form.description,
                    company_id: form.company_id ? parseInt(form.company_id) : null,
                    customer_id: form.customer_id ? parseInt(form.customer_id) : null
                })
            });

            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Deal created!' });
                onSuccess();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create deal', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Create New Deal</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Deal Title *</label>
                        <Input
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g., Website Redesign Project"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Value (₹)</label>
                            <Input
                                type="number"
                                value={form.amount}
                                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                placeholder="50000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Stage</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={form.stage}
                                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                            >
                                {STAGES.filter(s => !s.id.startsWith('closed')).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Company Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            Company
                        </label>
                        <select
                            className="w-full border rounded-lg p-2"
                            value={form.company_id}
                            onChange={(e) => setForm({ ...form, company_id: e.target.value, customer_id: '' })}
                        >
                            <option value="">-- Select Company --</option>
                            {companies.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Customer Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            <User className="w-4 h-4 inline mr-1" />
                            Contact/Customer
                        </label>
                        <select
                            className="w-full border rounded-lg p-2"
                            value={form.customer_id}
                            onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                        >
                            <option value="">-- Select Customer --</option>
                            {filteredCustomers.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.name || c.email} {c.company ? `(${c.company})` : ''}</option>
                            ))}
                        </select>
                        {form.company_id && filteredCustomers.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">No contacts linked to this company yet</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Expected Close Date</label>
                        <Input
                            type="date"
                            value={form.expected_close_date}
                            onChange={(e) => setForm({ ...form, expected_close_date: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full border rounded-lg p-2 h-20"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Deal details..."
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Deal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Deal Detail Modal Component
function DealDetailModal({ deal, onClose, onUpdate }: { deal: Deal; onClose: () => void; onUpdate: () => void }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleStatusChange = async (status: 'won' | 'lost') => {
        setLoading(true);
        try {
            const stage = status === 'won' ? 'closed_won' : 'closed_lost';
            const res = await fetch('/api/admin/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: deal.id, status, stage })
            });

            if ((await res.json()).success) {
                toast({ title: 'Success', description: `Deal marked as ${status}` });
                onUpdate();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update deal', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this deal?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/deals?id=${deal.id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Deal deleted' });
                onUpdate();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete deal', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">{deal.title}</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <span className="text-gray-600">Value</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(deal.amount)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500">Stage</span>
                            <p className="font-medium">
                                {STAGES.find(s => s.id === deal.stage)?.name || deal.stage}
                            </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500">Status</span>
                            <p className="font-medium capitalize">{deal.status}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Company
                            </span>
                            <p className="font-medium">{deal.company_name || 'Not assigned'}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                <User className="w-3 h-3" /> Customer
                            </span>
                            <p className="font-medium">{deal.customer_name || 'Not assigned'}</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500">Close Date</span>
                            <p className="font-medium">
                                {deal.expected_close_date
                                    ? new Date(deal.expected_close_date).toLocaleDateString()
                                    : 'Not set'}
                            </p>
                        </div>
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500">Owner</span>
                            <p className="font-medium">{deal.owner_name || 'Not set'}</p>
                        </div>
                    </div>

                    {deal.description && (
                        <div className="p-3 border rounded-lg">
                            <span className="text-xs text-gray-500">Description</span>
                            <p className="text-sm mt-1">{deal.description}</p>
                        </div>
                    )}

                    {deal.status === 'open' && (
                        <div className="flex gap-2 pt-4 border-t">
                            <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusChange('won')}
                                disabled={loading}
                            >
                                <Trophy className="w-4 h-4 mr-2" /> Mark Won
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleStatusChange('lost')}
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" /> Mark Lost
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Close
                        </Button>
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
