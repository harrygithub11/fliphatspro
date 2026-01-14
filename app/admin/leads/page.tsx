'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Mail, Phone, MoreHorizontal, Plus, Upload, Trash2, MapPin, Users, Activity } from 'lucide-react';
import { Calendar as CalendarIcon, Filter as FilterIcon, X, Target, Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from '@/components/ui/checkbox';
import { Tag, UserPlus, FileEdit } from 'lucide-react';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { LeadPreviewModal } from '@/components/admin/LeadPreviewModal';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    source: string;
    score: 'hot' | 'warm' | 'cold';
    stage: 'new' | 'contacted' | 'won' | 'lost' | 'follow_up_required' | 'follow_up_done' | 'qualified' | 'proposal_sent' | 'negotiation';
    owner: string;
    created_at: string;
    order_status?: string;
    order_source?: string;
    campaign_name?: string;
    total_activities?: number;
    new_activity_count?: number;
    location?: string;
    budget?: string;
    ltv?: number;
    notes?: string;
    tags?: string | any;
    // FB / Ad Data
    fb_lead_id?: string;
    fb_created_time?: string;
    ad_id?: string;
    ad_name?: string;
    adset_id?: string;
    adset_name?: string;
    form_id?: string;
    form_name?: string;
    is_organic?: boolean;
    platform?: string;
    fb_lead_status?: string;
    ad_account_id?: string;
    campaign_id?: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchWrapperRef = useRef<HTMLDivElement>(null);

    // New Lead State
    const [newLeadName, setNewLeadName] = useState('');
    const [newLeadEmail, setNewLeadEmail] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');
    const [newLeadLocation, setNewLeadLocation] = useState('');
    const [newLeadBudget, setNewLeadBudget] = useState('');
    const [newLeadCompany, setNewLeadCompany] = useState('');
    const [newLeadProjectDesc, setNewLeadProjectDesc] = useState('');
    const [newLeadNotes, setNewLeadNotes] = useState('');
    const [newLeadSource, setNewLeadSource] = useState('manual');

    // Ad Data Manual Entry
    const [newLeadPlatform, setNewLeadPlatform] = useState('');
    const [newLeadCampaign, setNewLeadCampaign] = useState('');
    const [newLeadAdName, setNewLeadAdName] = useState('');

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [csvImportOpen, setCsvImportOpen] = useState(false);
    const [deleteLeadId, setDeleteLeadId] = useState<number | null>(null);
    const [previewLeadId, setPreviewLeadId] = useState<number | null>(null);
    const [previewLeadData, setPreviewLeadData] = useState<Customer | undefined>(undefined);

    // Team members for assignment
    const [admins, setAdmins] = useState<{ id: number, name: string, email: string, avatar_url?: string }[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: number, name: string, email: string } | null>(null);
    const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(false);

    // Dynamic stages
    const [stages, setStages] = useState<{ id: number, value: string, label: string, color: string }[]>([]);

    // Dynamic scores
    const [scores, setScores] = useState<{ id: number, value: string, label: string, color: string, emoji: string }[]>([]);

    // Bulk selection state
    const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
    const [isBulkActionLoading, setIsBulkActionLoading] = useState(false);
    const [bulkTagOpen, setBulkTagOpen] = useState(false);
    const [bulkTagValue, setBulkTagValue] = useState('');

    // Goal State
    const [dailyGoal, setDailyGoal] = useState(50);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [tempGoal, setTempGoal] = useState('50');

    // Advanced Filters State
    const [filterStage, setFilterStage] = useState('all');
    const [filterScore, setFilterScore] = useState('all');
    const [filterTag, setFilterTag] = useState('all');
    const [filterCampaign, setFilterCampaign] = useState('');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Derived lists for filters
    const allTags = Array.from(new Set(leads.flatMap(l => {
        try {
            return l.tags ? (typeof l.tags === 'string' ? JSON.parse(l.tags) : l.tags) : [];
        } catch (e) { return []; }
    }))).sort();

    const allCampaigns = Array.from(new Set(leads.map(l => l.campaign_name).filter(Boolean))).sort();

    // Handle Click Outside for Suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [searchWrapperRef]);

    useEffect(() => {
        async function fetchLeads() {
            try {
                const res = await fetch('/api/admin/leads');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setLeads(data);
                }
            } catch (error) {
                console.error("Failed to fetch leads", error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchAdmins() {
            try {
                const res = await fetch('/api/admin/team');
                const data = await res.json();
                if (Array.isArray(data)) setAdmins(data);
            } catch (error) {
                console.error(error);
            }
        }

        async function fetchCurrentUser() {
            try {
                const res = await fetch('/api/admin/me');
                const data = await res.json();
                if (data.success) setCurrentUser(data.admin);
            } catch (error) {
                console.error(error);
            }
        }

        async function fetchStages() {
            try {
                const res = await fetch('/api/admin/stages');
                const data = await res.json();
                if (data.success && Array.isArray(data.stages)) setStages(data.stages);
            } catch (error) {
                console.error(error);
            }
        }

        async function fetchScores() {
            try {
                const res = await fetch('/api/admin/scores');
                const data = await res.json();
                if (data.success && Array.isArray(data.scores)) setScores(data.scores);
            } catch (error) {
                console.error(error);
            }
        }

        fetchLeads();
        fetchAdmins();
        fetchCurrentUser();
        fetchStages();
        fetchScores();

        // Load Goal from local storage
        const savedGoal = localStorage.getItem('leads_daily_goal');
        if (savedGoal) {
            setDailyGoal(parseInt(savedGoal));
            setTempGoal(savedGoal);
        }
    }, []);

    const saveGoal = () => {
        const val = parseInt(tempGoal);
        if (!isNaN(val) && val > 0) {
            setDailyGoal(val);
            localStorage.setItem('leads_daily_goal', val.toString());
        }
        setIsEditingGoal(false);
    }

    const getScoreBadge = (score: string) => {
        const scoreConfig = scores.find(s => s.value === score);
        if (!scoreConfig) return <Badge variant="outline" className="text-muted-foreground">Unknown</Badge>;

        const colorClasses: Record<string, string> = {
            'red': 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
            'yellow': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
            'gray': 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
        };

        const className = colorClasses[scoreConfig.color] || 'bg-gray-100 text-gray-700';
        return <Badge className={className}>{scoreConfig.label} {scoreConfig.emoji}</Badge>;
    };

    const handleSaveLead = async () => {
        if (!newLeadName || !newLeadEmail) {
            alert("Name and Email are required");
            return;
        }

        try {
            const res = await fetch('/api/admin/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newLeadName,
                    email: newLeadEmail,
                    phone: newLeadPhone,
                    source: newLeadSource,
                    location: newLeadLocation,
                    location: newLeadLocation,
                    budget: newLeadBudget,
                    company: newLeadCompany,
                    project_desc: newLeadProjectDesc,
                    notes: newLeadNotes,
                    // Ad Data
                    platform: newLeadPlatform,
                    campaign_name: newLeadCampaign,
                    ad_name: newLeadAdName
                })
            });
            const json = await res.json();

            if (json.success) {
                // Refresh list
                const resList = await fetch('/api/admin/leads');
                const dataList = await resList.json();
                if (Array.isArray(dataList)) setLeads(dataList);

                setIsDialogOpen(false);
                setNewLeadName('');
                setNewLeadEmail('');
                setNewLeadPhone('');
                setNewLeadLocation('');
                setNewLeadLocation('');
                setNewLeadBudget('');
                setNewLeadCompany('');
                setNewLeadProjectDesc('');
                setNewLeadNotes('');
                setNewLeadSource('manual');
                setNewLeadPlatform('');
                setNewLeadCampaign('');
                setNewLeadAdName('');
            } else {
                alert("Failed: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving lead");
        }
    };

    const getStageBadge = (stage: string) => {
        const stageConfig = stages.find(s => s.value === stage);
        if (!stageConfig) return <Badge variant="secondary">{stage ? stage.replace('_', ' ') : 'Unknown'}</Badge>;

        if (stageConfig.color && stageConfig.color.startsWith('#')) {
            return (
                <Badge
                    variant="outline"
                    style={{
                        backgroundColor: stageConfig.color,
                        borderColor: stageConfig.color, // optional: darker border?
                        color: '#1f2937' // text-gray-800
                    }}
                >
                    {stageConfig.label}
                </Badge>
            );
        }

        const colorClasses: Record<string, string> = {
            'amber': 'bg-amber-100 text-amber-700 border-amber-200',
            'blue': 'bg-blue-100 text-blue-700 border-blue-200',
            'emerald': 'text-emerald-600 bg-emerald-50 border-emerald-200',
            'green': 'bg-green-100 text-green-700 border-green-200',
            'purple': 'text-purple-600 bg-purple-50 border-purple-200',
            'orange': 'text-orange-600 bg-orange-50 border-orange-200',
            'gray': 'bg-gray-100 text-gray-700 border-gray-200'
        };

        const className = colorClasses[stageConfig.color] || '';
        return <Badge variant="outline" className={className}>{stageConfig.label}</Badge>;
    };


    const filtered = leads.filter(l => {
        // Global Search Filter (replaces Campaign Search + Table Search)
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm ? true : (
            (l.name || '').toLowerCase().includes(lowerSearch) ||
            (l.email || '').toLowerCase().includes(lowerSearch) ||
            (l.phone || '').toLowerCase().includes(lowerSearch) ||
            (l.location || '').toLowerCase().includes(lowerSearch) ||
            (l.notes || '').toLowerCase().includes(lowerSearch) ||
            (l.owner || '').toLowerCase().includes(lowerSearch) ||
            (l.source || '').toLowerCase().includes(lowerSearch) ||
            (l.campaign_name || '').toLowerCase().includes(lowerSearch) ||
            ((l as any).ad_data || '').toLowerCase().includes(lowerSearch) || // Search within ad data JSON
            String(l.id).includes(lowerSearch) ||
            (l.stage || '').toLowerCase().includes(lowerSearch) ||
            (l.score || '').toLowerCase().includes(lowerSearch) ||
            // Tag Search
            (() => {
                try {
                    const tags = l.tags ? (typeof l.tags === 'string' ? JSON.parse(l.tags) : l.tags) : [];
                    return Array.isArray(tags) && tags.some((t: string) => t.toLowerCase().includes(lowerSearch));
                } catch { return false; }
            })()
        );

        // My Leads filter
        const matchesOwner = !showMyLeadsOnly || (currentUser && l.owner === currentUser.name);

        // Advanced Filters
        const matchesStage = filterStage === 'all' || l.stage === filterStage;
        const matchesScore = filterScore === 'all' || l.score === filterScore;

        let matchesTag = true;
        if (filterTag !== 'all') {
            try {
                const tags = l.tags ? (typeof l.tags === 'string' ? JSON.parse(l.tags) : l.tags) : [];
                matchesTag = tags.includes(filterTag);
            } catch (e) { matchesTag = false; }
        }

        let matchesDate = true;
        if (dateRange.from) {
            const leadDate = new Date(l.created_at);
            const fromDate = new Date(dateRange.from);
            fromDate.setHours(0, 0, 0, 0);
            const leadDateDay = new Date(leadDate);
            leadDateDay.setHours(0, 0, 0, 0);

            if (leadDateDay < fromDate) matchesDate = false;

            if (dateRange.to && matchesDate) {
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                if (leadDate > toDate) matchesDate = false;
            }
        }

        // Source Filter
        const matchesSource = sourceFilter === 'all' ||
            ((l.order_source || l.source) === sourceFilter);

        return matchesSearch && matchesOwner && matchesSource && matchesStage && matchesScore && matchesTag && matchesDate;
    });

    // Reset all filters
    const clearFilters = () => {
        setSearchTerm('');
        setSourceFilter('all');
        setFilterStage('all');
        setFilterScore('all');
        setFilterTag('all');
        setFilterCampaign('');
        setDateRange({ from: undefined, to: undefined });
        setShowMyLeadsOnly(false);
    };

    // Bulk Actions Handlers
    const toggleSelectAll = () => {
        if (selectedLeads.length === filtered.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(filtered.map(l => l.id));
        }
    };

    const toggleSelectLead = (id: number) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lId => lId !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const handleBulkAction = async (action: string, data?: any) => {
        if (!selectedLeads.length) return;
        if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) return;

        setIsBulkActionLoading(true);
        try {
            const res = await fetch('/api/admin/leads/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    leadIds: selectedLeads,
                    data
                })
            });
            const result = await res.json();

            if (result.success) {
                toast({ description: result.message, className: 'bg-green-500 text-white' });
                // Refresh list
                const resList = await fetch('/api/admin/leads');
                const dataList = await resList.json();
                if (Array.isArray(dataList)) setLeads(dataList);
                setSelectedLeads([]); // Clear selection
                if (action === 'add_tags') setBulkTagOpen(false);
            } else {
                toast({ variant: 'destructive', description: result.message });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', description: 'Bulk action failed' });
        } finally {
            setIsBulkActionLoading(false);
        }
    };

    const updateLead = async (id: number, field: string, value: string) => {
        // Optimistic Update
        const oldLeads = [...leads];
        setLeads(leads.map(l => l.id === id ? { ...l, [field]: value } : l));

        try {
            const res = await fetch(`/api/admin/leads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            if (!res.ok) throw new Error("Update failed");
        } catch (error) {
            console.error(error);
            setLeads(oldLeads); // Revert
            // In real app, show toast error
        }
    };

    const deleteLead = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setLeads(leads.filter(l => l.id !== id));
                toast({ description: data.message || 'Lead deleted successfully', className: 'bg-green-500 text-white' });
            } else {
                toast({ variant: 'destructive', description: data.message || 'Failed to delete lead' });
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', description: 'Failed to delete lead' });
        } finally {
            setDeleteLeadId(null);
        }
    };

    // Stats Calculations
    const totalLeads = leads.length;
    const todayStr = new Date().toISOString().split('T')[0];
    const newLeadsToday = leads.filter(l => l.created_at.startsWith(todayStr)).length;
    const goalProgress = Math.min((newLeadsToday / dailyGoal) * 100, 100);

    return (
        <div className="space-y-6">
            {/* Header of Info */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Inbox</h1>
                    <p className="text-muted-foreground">The Control Room: Manage and track every potential deal.</p>
                </div>

                <div className="flex items-center gap-8 divide-x divide-zinc-200 dark:divide-zinc-800">
                    {/* Stat: Total Leads */}
                    <div className="px-4 first:pl-0 flex flex-col items-center">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Leads</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold">{filtered.length}</span>
                            {filtered.length !== leads.length && <span className="text-[10px] text-muted-foreground">/ {leads.length}</span>}
                        </div>
                    </div>

                    {/* Stat: New Today */}
                    <div className="px-4 flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New This Week</span>
                            {newLeadsToday > 0 && <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 rounded-full">+{newLeadsToday}</span>}
                        </div>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{newLeadsToday}</span>
                    </div>

                    {/* Stat: Daily Goal */}
                    <div className="px-4 flex flex-col items-center min-w-[140px]">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Goal</span>
                            {isEditingGoal ? (
                                <Input
                                    className="h-5 w-12 text-[10px] px-1 py-0"
                                    value={tempGoal}
                                    onChange={e => setTempGoal(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && saveGoal()}
                                    onBlur={saveGoal}
                                />
                            ) : (
                                <button onClick={() => setIsEditingGoal(true)} className="text-muted-foreground hover:text-foreground">
                                    <Pencil className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="w-full">
                            <div className="flex justify-between text-[10px] mb-1 font-medium">
                                <span>{newLeadsToday} / {dailyGoal}</span>
                                <span>{goalProgress.toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${goalProgress}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => setCsvImportOpen(true)} variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Add Manual Lead</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add New Lead</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Name</Label>
                                    <Input id="name" className="col-span-3" placeholder="John Doe" value={newLeadName} onChange={e => setNewLeadName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Email</Label>
                                    <Input id="email" className="col-span-3" placeholder="john@example.com" value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Phone</Label>
                                    <Input id="phone" className="col-span-3" placeholder="+91 98765 43210" value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Location</Label>
                                    <Input id="location" className="col-span-3" placeholder="City, Country" value={newLeadLocation} onChange={e => setNewLeadLocation(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Budget</Label>
                                    <Input id="budget" type="text" className="col-span-3" placeholder="e.g. $1k - $5k" value={newLeadBudget} onChange={e => setNewLeadBudget(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Company</Label>
                                    <Input id="company" className="col-span-3" placeholder="Company Name" value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Proj. Desc</Label>
                                    <Input id="project_desc" className="col-span-3" placeholder="Brief project details..." value={newLeadProjectDesc} onChange={e => setNewLeadProjectDesc(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Source</Label>
                                    <Select value={newLeadSource} onValueChange={setNewLeadSource}>
                                        <SelectTrigger className="col-span-3"><SelectValue placeholder="Select source" /></SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            <SelectItem value="manual">Manual Entry</SelectItem>
                                            <SelectItem value="phone">Phone Call</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                            <SelectItem value="website">Website</SelectItem>
                                            <SelectItem value="referral">Referral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label className="text-right">Notes</Label>
                                    <div className="col-span-3">
                                        <Input id="notes" placeholder="Initial requirements..." value={newLeadNotes} onChange={e => setNewLeadNotes(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveLead}>Save Lead</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* CSV Import Modal */}
                <CSVImportModal
                    open={csvImportOpen}
                    onClose={() => setCsvImportOpen(false)}
                    onSuccess={() => {
                        // Refresh leads after successful import
                        fetch('/api/admin/leads')
                            .then(res => res.json())
                            .then(data => Array.isArray(data) && setLeads(data));
                    }}
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-3 items-center animate-in slide-in-from-top-4">
                <div className="flex items-center gap-2 mr-1">
                    <FilterIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Filters:</span>
                </div>

                {/* Source Filter (Moved) */}
                {/* Source Filter (Dynamic) */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                        <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        {Array.from(new Set(leads.map(l => l.order_source || l.source).filter(Boolean))).map((src: any) => (
                            <SelectItem key={src} value={src}>{src}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Stage Filter */}
                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                        <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {stages.map(stage => (
                            <SelectItem key={stage.id} value={stage.value}>{stage.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Score Filter */}
                <Select value={filterScore} onValueChange={setFilterScore}>
                    <SelectTrigger className="w-[110px] h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                        <SelectValue placeholder="Score" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Scores</SelectItem>
                        {scores.map(score => (
                            <SelectItem key={score.id} value={score.value}>{score.label} {score.emoji}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Tag Filter */}
                <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="w-[120px] h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                        <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tags</SelectItem>
                        {allTags.map(tag => (
                            <SelectItem key={tag} value={tag as string}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Global Search Input */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground z-10" />
                    <Input
                        placeholder="Search everything..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 w-full"
                    />
                </div>

                {/* Date Range Picker */}
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 p-0.5 px-2">
                    <Input
                        type="date"
                        value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={e => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="h-6 w-[100px] text-[10px] border-none shadow-none focus-visible:ring-0 p-0 bg-transparent"
                    />
                    <span className="text-zinc-400 text-xs">-</span>
                    <Input
                        type="date"
                        value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={e => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        className="h-6 w-[100px] text-[10px] border-none shadow-none focus-visible:ring-0 p-0 bg-transparent"
                    />
                </div>

                {/* Show My Leads Button (Moved) */}
                <Button
                    variant={showMyLeadsOnly ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setShowMyLeadsOnly(!showMyLeadsOnly)}
                    className="h-8 text-xs"
                >
                    {showMyLeadsOnly ? "Showing Mine" : "My Leads"}
                </Button>

                {/* Clear Filters */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs text-zinc-500 hover:text-red-500"
                >
                    <X className="w-3 h-3 mr-1" /> Clear
                </Button>
            </div>

            {
                selectedLeads.length > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-zinc-700">
                        <div className="flex items-center gap-3 border-r border-zinc-700 pr-6">
                            <span className="font-bold text-sm bg-white text-black px-2 py-0.5 rounded-full">{selectedLeads.length}</span>
                            <span className="text-sm font-medium">Selected</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-zinc-800 gap-2 h-8">
                                        <Tag className="w-4 h-4" /> Tag
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-2 w-64 bg-zinc-900 border-zinc-800 text-white">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter tag name..."
                                            value={bulkTagValue}
                                            onChange={e => setBulkTagValue(e.target.value)}
                                            className="bg-zinc-800 border-zinc-700 text-white h-8"
                                        />
                                        <Button
                                            size="sm"
                                            className="h-8 bg-primary hover:bg-primary/90"
                                            onClick={() => handleBulkAction('add_tags', { tag: bulkTagValue })}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Set Stage */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-zinc-800 gap-2 h-8">
                                        <Target className="w-4 h-4" /> Set Stage
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-1 w-56 bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuLabel>Change Stage To...</DropdownMenuLabel>
                                    {stages.map(stage => (
                                        <DropdownMenuItem
                                            key={stage.id}
                                            onClick={() => handleBulkAction('update_status', { stage: stage.value })}
                                            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }}></div>
                                                {stage.label}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Set Score */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-zinc-800 gap-2 h-8">
                                        <Activity className="w-4 h-4" /> Set Score
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="p-1 w-56 bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuLabel>Change Score To...</DropdownMenuLabel>
                                    {scores.map(score => (
                                        <DropdownMenuItem
                                            key={score.id}
                                            onClick={() => handleBulkAction('update_score', { score: score.value })}
                                            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{score.emoji}</span>
                                                {score.label}
                                            </div>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-zinc-800 gap-2 h-8">
                                        <UserPlus className="w-4 h-4" /> Assign
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuLabel>Assign Owner</DropdownMenuLabel>
                                    {admins.map(admin => (
                                        <DropdownMenuItem
                                            key={admin.id}
                                            onClick={() => handleBulkAction('assign_owner', { owner: admin.name })}
                                            className="hover:bg-zinc-800 cursor-pointer focus:bg-zinc-800 focus:text-white"
                                        >
                                            <Avatar className="h-5 w-5 mr-2">
                                                <AvatarImage src={admin.avatar_url || ''} />
                                                <AvatarFallback className="text-[10px] text-black">{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            {admin.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-2 h-8"
                                onClick={() => handleBulkAction('delete')}
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-8 w-8 ml-2 rounded-full"
                                onClick={() => setSelectedLeads([])}
                            >
                                <span className="sr-only">Clear selection</span>
                                &times;
                            </Button>
                        </div>
                    </div>
                )
            }

            < Card >
                <CardHeader className="p-0">
                    {/* Header cleaned up - toolbar moved to main filter bar */}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                    <Checkbox
                                        checked={filtered.length > 0 && selectedLeads.length === filtered.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                    />
                                </TableHead>
                                <TableHead>Lead Name</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Order Status</TableHead>
                                <TableHead>Owner</TableHead>
                                <TableHead>Activity</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24">Loading inbox...</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No leads found.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((lead) => (
                                    <TableRow key={lead.id} className={`group cursor-pointer hover:bg-muted/50 ${selectedLeads.includes(lead.id) ? 'bg-muted/50' : ''}`}>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedLeads.includes(lead.id)}
                                                onCheckedChange={() => toggleSelectLead(lead.id)}
                                                aria-label="Select row"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div
                                                className="block cursor-pointer group"
                                                onClick={() => {
                                                    setPreviewLeadId(lead.id);
                                                    setPreviewLeadData(lead);
                                                }}
                                            >
                                                <div className="font-medium text-primary group-hover:underline flex items-center gap-2">
                                                    {lead.name}
                                                    {lead.location && (
                                                        <span className="text-xs font-normal text-muted-foreground flex items-center gap-0.5">
                                                            <MapPin className="w-3 h-3" /> {lead.location}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{lead.email}</div>
                                                {lead.phone && <div className="text-xs text-muted-foreground">{lead.phone}</div>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {lead.order_source === 'lifetime_12k' ? <Badge className="bg-purple-100 text-purple-700 border-purple-200">12k Offer</Badge> :
                                                lead.order_source === 'newyear_5k' ? <Badge className="bg-red-100 text-red-700 border-red-200">5k Offer</Badge> :
                                                    lead.source === 'Facebook Lead Form' ? <Badge className="bg-blue-100 text-blue-700 border-blue-200">Facebook 📘</Badge> :
                                                        lead.source === 'csv_import' && lead.campaign_name ? (
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="text-xs font-medium">{lead.source}</span>
                                                                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 max-w-[150px] truncate" title={lead.campaign_name}>
                                                                    {lead.campaign_name}
                                                                </Badge>
                                                            </div>
                                                        ) :
                                                            lead.source}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={lead.score}
                                                onValueChange={(val) => updateLead(lead.id, 'score', val)}
                                            >
                                                <SelectTrigger className="h-8 w-[100px] border-none shadow-none bg-transparent hover:bg-muted p-1">
                                                    <SelectValue placeholder="Score" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {scores.map(score => {
                                                        const colorClasses: Record<string, string> = {
                                                            'red': 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
                                                            'yellow': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
                                                            'gray': 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                                        };
                                                        const className = colorClasses[score.color] || '';
                                                        return (
                                                            <SelectItem key={score.id} value={score.value}>
                                                                <Badge className={`${className} pointer-events-none`}>
                                                                    {score.label} {score.emoji}
                                                                </Badge>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={lead.stage}
                                                onValueChange={(val) => updateLead(lead.id, 'stage', val)}
                                            >
                                                <SelectTrigger className="h-8 w-[130px] border-none shadow-none bg-transparent hover:bg-muted p-1">
                                                    <SelectValue placeholder="Stage" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {stages.map(stage => {
                                                        if (stage.color && stage.color.startsWith('#')) {
                                                            return (
                                                                <SelectItem key={stage.id} value={stage.value}>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="pointer-events-none"
                                                                        style={{
                                                                            backgroundColor: stage.color,
                                                                            borderColor: stage.color,
                                                                            color: '#1f2937'
                                                                        }}
                                                                    >
                                                                        {stage.label}
                                                                    </Badge>
                                                                </SelectItem>
                                                            );
                                                        }

                                                        const colorClasses: Record<string, string> = {
                                                            'amber': 'bg-amber-100 text-amber-700 border-amber-200',
                                                            'blue': 'bg-blue-100 text-blue-700 border-blue-200',
                                                            'emerald': 'text-emerald-600 bg-emerald-50 border-emerald-200',
                                                            'green': 'bg-green-100 text-green-700 border-green-200',
                                                            'purple': 'text-purple-600 bg-purple-50 border-purple-200',
                                                            'orange': 'text-orange-600 bg-orange-50 border-orange-200',
                                                            'gray': 'bg-gray-100 text-gray-700 border-gray-200'
                                                        };
                                                        const className = colorClasses[stage.color] || '';
                                                        return (
                                                            <SelectItem key={stage.id} value={stage.value}>
                                                                <Badge variant="outline" className={`${className} pointer-events-none`}>
                                                                    {stage.label}
                                                                </Badge>
                                                            </SelectItem>
                                                        );
                                                    })}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            {lead.order_status ? (
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        lead.order_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                                                            lead.order_status === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                lead.order_status === 'paid' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                                    lead.order_status === 'initiated' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                                        'bg-gray-50 text-gray-700 border-gray-200'
                                                    }
                                                >
                                                    {lead.order_status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No Order</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                defaultValue={lead.owner}
                                                onValueChange={(val) => updateLead(lead.id, 'owner', val)}
                                            >
                                                <SelectTrigger className="h-8 w-fit min-w-[140px] border-none shadow-none bg-transparent hover:bg-muted p-1 px-2 rounded-full ring-0 focus:ring-0">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">
                                                        <span className="text-muted-foreground italic pl-2">Unassigned</span>
                                                    </SelectItem>
                                                    {admins.map(admin => (
                                                        <SelectItem key={admin.id} value={admin.name}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-5 w-5">
                                                                    <AvatarImage src={admin.avatar_url || ''} />
                                                                    <AvatarFallback className="text-[10px]">{admin.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span>{admin.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800">
                                                    {lead.total_activities || 0}
                                                </Badge>
                                                {(lead.new_activity_count || 0) > 0 && (
                                                    <Badge className="bg-blue-500 hover:bg-blue-600">
                                                        +{lead.new_activity_count} New
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`/admin/leads/${lead.id}`} className="cursor-pointer">View Profile</a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`tel:${lead.phone}`} className="cursor-pointer">Call Now</a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <a href={`https://wa.me/${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">Send WhatsApp</a>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => setDeleteLeadId(lead.id)}
                                                        className="text-red-600 focus:text-red-600 cursor-pointer"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Lead
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card >

            {/* Delete Confirmation Dialog */}
            < AlertDialog open={deleteLeadId !== null
            } onOpenChange={() => setDeleteLeadId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this lead? This action cannot be undone and will remove all associated data including interactions, tasks, and files.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteLeadId && deleteLead(deleteLeadId)}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >

            {/* Lead Preview Modal */}
            < LeadPreviewModal
                open={!!previewLeadId}
                onOpenChange={(open) => !open && setPreviewLeadId(null)}
                leadId={previewLeadId}
                initialData={previewLeadData}
                stages={stages}
                scores={scores}
                admins={admins}
                onUpdate={() => {
                    // Refresh listing silently
                    fetch(`/api/admin/leads?t=${new Date().getTime()}`)
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data)) setLeads(data);
                        });
                }}
            />
        </div >
    );
}
