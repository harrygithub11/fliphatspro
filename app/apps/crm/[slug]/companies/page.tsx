'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Search, Building2, Globe, Users, DollarSign, Phone,
    MapPin, MoreVertical, Edit, Trash2, X, Loader2, ExternalLink,
    Linkedin, TrendingUp, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface Company {
    id: number;
    name: string;
    domain: string;
    industry: string;
    size: string;
    website: string;
    phone: string;
    city: string;
    country: string;
    logo_url: string;
    linkedin_url: string;
    annual_revenue: number;
    employee_count: number;
    owner_name: string;
    contact_count: number;
    deal_count: number;
    created_at: string;
}

const SIZE_LABELS: Record<string, string> = {
    '1-10': '1-10 employees',
    '11-50': '11-50 employees',
    '51-200': '51-200 employees',
    '201-500': '201-500 employees',
    '501-1000': '501-1000 employees',
    '1000+': '1000+ employees'
};

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [industries, setIndustries] = useState<string[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const { toast } = useToast();

    const loadCompanies = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/admin/companies?${params}`);
            const data = await res.json();
            if (data.success) {
                setCompanies(data.companies || []);
                setIndustries(data.industries || []);
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to load companies:', error);
            toast({ title: 'Error', description: 'Failed to load companies', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [searchQuery, toast]);

    useEffect(() => {
        loadCompanies();
    }, [loadCompanies]);

    const formatCurrency = (amount: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

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
                    <h1 className="text-3xl font-black uppercase tracking-tight">Companies</h1>
                    <p className="text-muted-foreground">Manage your business accounts and organizations</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Company
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Companies</p>
                            <p className="text-2xl font-bold">{stats?.total_companies || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Enterprise Accounts</p>
                            <p className="text-2xl font-bold">{stats?.enterprise_count || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Revenue</p>
                            <p className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search companies..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {industries.length > 0 && (
                    <select className="border rounded-lg px-3 py-2 text-sm">
                        <option value="">All Industries</option>
                        {industries.map(ind => (
                            <option key={ind} value={ind}>{ind}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((company) => (
                    <div
                        key={company.id}
                        className="bg-white rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setSelectedCompany(company)}
                    >
                        <div className="flex items-start gap-4">
                            {/* Logo */}
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {company.logo_url ? (
                                    <img src={company.logo_url} alt={company.name} className="w-full h-full rounded-lg object-cover" />
                                ) : (
                                    company.name.charAt(0).toUpperCase()
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                                {company.industry && (
                                    <p className="text-sm text-gray-500">{company.industry}</p>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCompany(company);
                                }}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {company.size && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>{SIZE_LABELS[company.size] || company.size}</span>
                                </div>
                            )}
                            {company.city && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{company.city}</span>
                                </div>
                            )}
                            {company.website && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Globe className="w-4 h-4" />
                                    <a
                                        href={company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-primary truncate"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {company.domain || 'Website'}
                                    </a>
                                </div>
                            )}
                            {company.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span>{company.phone}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <div className="flex gap-4 text-sm">
                                <span className="text-gray-500">
                                    <strong className="text-gray-900">{company.contact_count || 0}</strong> contacts
                                </span>
                                <span className="text-gray-500">
                                    <strong className="text-gray-900">{company.deal_count || 0}</strong> deals
                                </span>
                            </div>
                            {company.annual_revenue > 0 && (
                                <span className="text-sm font-semibold text-green-600">
                                    {formatCurrency(company.annual_revenue)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {companies.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No companies yet</p>
                        <p className="text-sm">Add your first company to get started</p>
                        <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Add Company
                        </Button>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateCompanyModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadCompanies();
                    }}
                />
            )}

            {/* Detail Modal */}
            {selectedCompany && (
                <CompanyDetailModal
                    company={selectedCompany}
                    onClose={() => setSelectedCompany(null)}
                    onUpdate={() => {
                        setSelectedCompany(null);
                        loadCompanies();
                    }}
                />
            )}
        </div>
    );
}

function CreateCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        domain: '',
        industry: '',
        size: '',
        website: '',
        phone: '',
        city: '',
        country: ''
    });
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name) {
            toast({ title: 'Error', description: 'Company name is required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Company created!' });
                onSuccess();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create company', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Add Company</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Company Name *</label>
                        <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., Acme Inc."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Domain</label>
                            <Input
                                value={form.domain}
                                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                                placeholder="acme.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Industry</label>
                            <Input
                                value={form.industry}
                                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                                placeholder="Technology"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Size</label>
                            <select
                                className="w-full border rounded-lg p-2"
                                value={form.size}
                                onChange={(e) => setForm({ ...form, size: e.target.value })}
                            >
                                <option value="">Select size</option>
                                <option value="1-10">1-10</option>
                                <option value="11-50">11-50</option>
                                <option value="51-200">51-200</option>
                                <option value="201-500">201-500</option>
                                <option value="501-1000">501-1000</option>
                                <option value="1000+">1000+</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Website</label>
                        <Input
                            value={form.website}
                            onChange={(e) => setForm({ ...form, website: e.target.value })}
                            placeholder="https://acme.com"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <Input
                                value={form.city}
                                onChange={(e) => setForm({ ...form, city: e.target.value })}
                                placeholder="Mumbai"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Country</label>
                            <Input
                                value={form.country}
                                onChange={(e) => setForm({ ...form, country: e.target.value })}
                                placeholder="India"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Company'}
                        </Button>
                    </div>
                </form>

            </div>
        </div >
    );
}

function CompanyDetailModal({ company, onClose, onUpdate }: { company: Company; onClose: () => void; onUpdate: () => void }) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'deals'>('details');
    const [companyData, setCompanyData] = useState<any>(null);
    const [showAddContacts, setShowAddContacts] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
    const [contactSearch, setContactSearch] = useState(''); // Custom search state
    const { toast } = useToast();

    // Load full company data with contacts and deals
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                console.log('Fetching company details for:', company.id);
                const res = await fetch(`/api/admin/companies/${company.id}`);
                const data = await res.json();

                console.log('Company Details Response:', data);
                console.log('Available Contacts Count:', data.availableContacts?.length || 0);

                if (data.success) {
                    setCompanyData(data);
                } else {
                    toast({ title: 'Error', description: data.message || 'Failed to load details', variant: 'destructive' });
                }
            } catch (error) {
                console.error('Failed to load company details', error);
                toast({ title: 'Error', description: 'Failed to load company details', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [company.id]);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this company?')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/companies?id=${company.id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Company deleted' });
                onUpdate();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete company', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleLinkContacts = async () => {
        if (selectedContacts.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/companies/${company.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'link_contacts', contactIds: selectedContacts })
            });
            if ((await res.json()).success) {
                toast({ title: 'Success', description: `${selectedContacts.length} contacts linked` });
                setShowAddContacts(false);
                setSelectedContacts([]);
                // Reload data
                const data = await (await fetch(`/api/admin/companies/${company.id}`)).json();
                if (data.success) setCompanyData(data);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to link contacts', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleUnlinkContact = async (contactId: number) => {
        try {
            const res = await fetch(`/api/admin/companies/${company.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unlink_contact', contactId })
            });
            if ((await res.json()).success) {
                toast({ title: 'Success', description: 'Contact unlinked' });
                const data = await (await fetch(`/api/admin/companies/${company.id}`)).json();
                if (data.success) setCompanyData(data);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to unlink', variant: 'destructive' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex flex-col h-[80vh]">
                    {loading && !companyData ? (
                        <div className="flex flex-1 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                        {company.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{company.name}</h2>
                                        {company.industry && <p className="text-sm text-gray-500">{company.industry}</p>}
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 border-b mb-4">
                                {(['details', 'contacts', 'deals'] as const).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${activeTab === tab
                                            ? 'text-primary border-b-2 border-primary'
                                            : 'text-gray-500 hover:text-gray-900'
                                            }`}
                                    >
                                        {tab}
                                        {tab === 'contacts' && companyData?.contacts && (
                                            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                {companyData.contacts.length}
                                            </span>
                                        )}
                                        {tab === 'deals' && companyData?.deals && (
                                            <span className="ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                {companyData.deals.length}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                {activeTab === 'details' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            {company.website && (
                                                <a href={company.website} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                                                    <Globe className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm">Website</span>
                                                    <ExternalLink className="w-3 h-3 ml-auto" />
                                                </a>
                                            )}
                                            {company.linkedin_url && (
                                                <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                                                    <Linkedin className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm">LinkedIn</span>
                                                    <ExternalLink className="w-3 h-3 ml-auto" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-3 border rounded-lg">
                                                <span className="text-xs text-gray-500">Size</span>
                                                <p className="font-medium">{SIZE_LABELS[company.size] || company.size || '-'}</p>
                                            </div>
                                            <div className="p-3 border rounded-lg">
                                                <span className="text-xs text-gray-500">Location</span>
                                                <p className="font-medium">{[company.city, company.country].filter(Boolean).join(', ') || '-'}</p>
                                            </div>
                                        </div>
                                        {company.phone && (
                                            <div className="flex items-center gap-2 p-3 border rounded-lg">
                                                <Phone className="w-4 h-4 text-gray-500" />
                                                <span>{company.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'contacts' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium">Linked Contacts</h3>
                                            <Button size="sm" onClick={() => setShowAddContacts(!showAddContacts)}>
                                                <Plus className="w-4 h-4 mr-1" /> Add Contacts
                                            </Button>
                                        </div>

                                        {showAddContacts && (
                                            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                                                <p className="text-sm font-medium">Select contacts to link:</p>
                                                <div className="border rounded-md overflow-hidden bg-white dark:bg-zinc-950">
                                                    <div className="flex items-center border-b px-3">
                                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                        <input
                                                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
                                                            placeholder="Search customers..."
                                                            value={contactSearch}
                                                            onChange={(e) => setContactSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto p-1">
                                                        {companyData?.availableContacts
                                                            ?.filter((c: any) =>
                                                                (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) ||
                                                                (c.email || '').toLowerCase().includes(contactSearch.toLowerCase())
                                                            )
                                                            .map((c: any) => (
                                                                <div
                                                                    key={c.id}
                                                                    className={cn(
                                                                        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                                                        selectedContacts.includes(c.id) && "bg-zinc-100 dark:bg-zinc-800"
                                                                    )}
                                                                    onClick={() => {
                                                                        if (selectedContacts.includes(c.id)) {
                                                                            setSelectedContacts(selectedContacts.filter(id => id !== c.id));
                                                                        } else {
                                                                            setSelectedContacts([...selectedContacts, c.id]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        selectedContacts.includes(c.id)
                                                                            ? "bg-primary text-primary-foreground"
                                                                            : "opacity-50 [&_svg]:invisible"
                                                                    )}>
                                                                        <Check className={cn("h-4 w-4")} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{c.name || 'Unnamed'}</p>
                                                                        <p className="text-xs text-muted-foreground">{c.email}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        {(!companyData?.availableContacts || companyData.availableContacts.length === 0) && (
                                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                                No available contacts found.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={handleLinkContacts} disabled={selectedContacts.length === 0 || loading}>
                                                    Link {selectedContacts.length} Contact(s)
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {companyData?.contacts?.map((c: any) => (
                                                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div>
                                                        <p className="font-medium">{c.name || 'Unnamed'}</p>
                                                        <p className="text-sm text-gray-500">{c.email}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${c.score === 'hot' ? 'bg-red-100 text-red-700' :
                                                            c.score === 'warm' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {c.score || 'new'}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                                                            onClick={() => handleUnlinkContact(c.id)}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!companyData?.contacts || companyData.contacts.length === 0) && (
                                                <p className="text-center text-gray-500 py-8">No contacts linked yet</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'deals' && (
                                    <div className="space-y-2">
                                        {companyData?.deals?.map((d: any) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{d.title}</p>
                                                    <p className="text-sm text-gray-500">{d.stage}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-green-600">₹{d.amount?.toLocaleString()}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'won' ? 'bg-green-100 text-green-700' :
                                                        d.status === 'lost' ? 'bg-red-100 text-red-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {d.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {(!companyData?.deals || companyData.deals.length === 0) && (
                                            <p className="text-center text-gray-500 py-8">No deals linked yet</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-2 pt-4 border-t mt-4">
                                <Button variant="outline" className="flex-1" onClick={onClose}>
                                    Close
                                </Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

