'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Mail, Phone, MoreHorizontal, Plus, Upload, Trash2, MapPin } from 'lucide-react';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { LeadPreviewModal } from '@/components/admin/LeadPreviewModal';
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
    budget?: number;
    ltv?: number;
    notes?: string;
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
    }, []);

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
                    budget: newLeadBudget,
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
                setNewLeadBudget('');
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
        // Search filter
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
            l.name?.toLowerCase().includes(lowerSearch) ||
            l.email?.toLowerCase().includes(lowerSearch) ||
            l.phone?.toLowerCase().includes(lowerSearch) ||
            l.location?.toLowerCase().includes(lowerSearch);

        // My Leads filter
        const matchesOwner = !showMyLeadsOnly || (currentUser && l.owner === currentUser.name);

        // Source Filter
        const matchesSource = sourceFilter === 'all' ||
            (l.order_source === sourceFilter) ||
            (l.source === sourceFilter) ||
            (sourceFilter === 'lifetime_12k' && l.order_source === 'lifetime_12k') ||
            (sourceFilter === 'newyear_5k' && l.order_source === 'newyear_5k') ||
            (sourceFilter === 'facebook' && l.source === 'Facebook Lead Form');

        return matchesSearch && matchesOwner && matchesSource;
    });

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Inbox</h1>
                    <p className="text-muted-foreground">The Control Room: Manage and track every potential deal.</p>
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
                                    <Input id="budget" type="number" className="col-span-3" placeholder="0.00" value={newLeadBudget} onChange={e => setNewLeadBudget(e.target.value)} />
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

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Leads</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={showMyLeadsOnly ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowMyLeadsOnly(!showMyLeadsOnly)}
                            >
                                {showMyLeadsOnly ? "Showing My Leads" : "Show My Leads"}
                            </Button>
                            <div className="relative w-72" ref={searchWrapperRef}>
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                                <Input
                                    placeholder="Search via Name, Email, Phone, Location..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                />
                                {showSuggestions && searchTerm && filtered.length > 0 && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-zinc-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-[400px] overflow-y-auto">
                                        {filtered.slice(0, 5).map(lead => (
                                            <div
                                                key={lead.id}
                                                className="px-4 py-3 hover:bg-zinc-50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-b-0"
                                                onClick={() => {
                                                    window.location.href = `/admin/leads/${lead.id}`;
                                                    setShowSuggestions(false);
                                                }}
                                            >
                                                <Avatar className="h-10 w-10 shrink-0">
                                                    <AvatarImage src={''} />
                                                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                                                        {lead.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="font-bold text-sm text-black truncate">{lead.name}</span>
                                                    <span className="text-xs text-zinc-400 truncate">{lead.email}</span>
                                                    {lead.phone && <span className="text-xs text-zinc-400 truncate">{lead.phone}</span>}
                                                </div>
                                                {lead.score && (
                                                    <div className="shrink-0">
                                                        {getScoreBadge(lead.score)}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Select value={sourceFilter} onValueChange={setSourceFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Filter Source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sources</SelectItem>
                                    <SelectItem value="newyear_5k">5k Offer</SelectItem>
                                    <SelectItem value="lifetime_12k">12k Offer</SelectItem>
                                    <SelectItem value="Strategy Call">Strategy Call</SelectItem>
                                    <SelectItem value="manual">Manual Entry</SelectItem>
                                    <SelectItem value="website">Website</SelectItem>
                                    <SelectItem value="facebook">Facebook Leads</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
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
                                    <TableCell colSpan={7} className="text-center h-24">Loading inbox...</TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No leads found.</TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((lead) => (
                                    <TableRow key={lead.id} className="group cursor-pointer hover:bg-muted/50">
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
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteLeadId !== null} onOpenChange={() => setDeleteLeadId(null)}>
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
            </AlertDialog>

            {/* Lead Preview Modal */}
            <LeadPreviewModal
                open={!!previewLeadId}
                onOpenChange={(open) => !open && setPreviewLeadId(null)}
                leadId={previewLeadId}
                initialData={previewLeadData}
                stages={stages}
                scores={scores}
                admins={admins}
                onUpdate={() => {
                    // Refresh listing silently
                    fetch('/api/admin/leads')
                        .then(res => res.json())
                        .then(data => {
                            if (Array.isArray(data)) setLeads(data);
                        });
                }}
            />
        </div>
    );
}
