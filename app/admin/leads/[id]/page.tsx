'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Phone, Mail, Globe, Calendar, Clock,
    MessageSquare, PhoneCall, FileText, CheckCircle2,
    Plus, Send, Paperclip, Rocket, MapPin, StickyNote, Pencil, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useComposeEmail } from '@/context/ComposeEmailContext';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    source: string;
    score: string;
    stage: string;
    tags: string | any; // JSON string or parsed array
    owner: string;
    store_url?: string;
    avatar_url?: string;
    created_at: string;
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
    campaign_id?: string;
    campaign_name?: string;
    form_id?: string;
    form_name?: string;
    is_organic?: boolean;
    platform?: string;
    fb_lead_status?: string;
}

interface Deal {
    id: number;
    amount: number;
    status: string;
    created_at: string;
    proposal_status: string;
}

interface Task {
    id: number;
    title: string;
    due_date?: string;
    status: string;
    priority: string;
}

interface Interaction {
    id: number;
    type: string;
    content: string;
    created_at: string;
    created_by: number;
    created_by_name?: string;
    created_by_email?: string;
}

interface FileItem {
    id: number;
    file_name: string;
    file_url: string;
    file_type: string;
    created_at: string;
}

// Helper function to format timeline messages
const formatTimelineMessage = (content: string, type: string): string => {
    try {
        const data = JSON.parse(content);

        // Booking form submission
        if (data.source === 'booking_form' && data.action === 'form_submitted') {
            return `📞 Requested a strategy call${data.store ? ` for ${data.store}` : ''}`;
        }

        // Other system events
        if (data.action) {
            return data.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        }

        // Fallback to original content if not JSON or unknown format
        return content;
    } catch (e) {
        // Not JSON, return as-is
        return content;
    }
};

export default function LeadProfilePage({ params }: { params: { id: string } }) {
    const [activeTab, setActiveTab] = useState("timeline");
    const [noteContent, setNoteContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        profile: Customer;
        deals: Deal[];
        tasks: Task[];
        timeline: Interaction[];
        files: FileItem[];
        emails: any[];
    } | null>(null);

    // --- Dynamic Actions ---
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [dealDialogOpen, setDealDialogOpen] = useState(false);

    // Task State
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDate, setNewTaskDate] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("");
    const [newTaskPriority, setNewTaskPriority] = useState("medium");

    // Deal State
    const [newDealAmount, setNewDealAmount] = useState("");
    const [newDealStatus, setNewDealStatus] = useState("initiated");

    // File State
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const [fileName, setFileName] = useState("");
    const [fileUrl, setFileUrl] = useState("");

    // Proposal State
    const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
    const [proposalTitle, setProposalTitle] = useState("");
    const [proposalAmount, setProposalAmount] = useState("");
    const [proposalContent, setProposalContent] = useState("");

    // Global Compose
    const { openCompose } = useComposeEmail();

    // Notes Edit State
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [tempNotes, setTempNotes] = useState('');

    const handleSaveNotes = async () => {
        if (!data?.profile?.id) return;
        await updateLead('notes', tempNotes);
        setIsEditingNotes(false);
    };
    const [editProfileOpen, setEditProfileOpen] = useState(false); // Edit Profile Modal

    // Dynamic stages
    const [stages, setStages] = useState<{ id: number, value: string, label: string, color: string }[]>([]);

    // Dynamic scores
    const [scores, setScores] = useState<{ id: number, value: string, label: string, color: string, emoji: string }[]>([]);

    // Timeline Filter
    const [timelineFilter, setTimelineFilter] = useState<'all' | 'notes' | 'system'>('all');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`/api/admin/leads/${params.id}`);
                const json = await res.json();
                if (json.success) {
                    setData(json.data);
                }
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
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

        fetchProfile();
        fetchStages();
        fetchScores();
    }, [params.id]);

    if (loading) return <div className="p-10 text-center">Loading 360 View...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Lead not found.</div>;

    const { deals, tasks, timeline, files } = data;

    // Filter Timeline
    const filteredTimeline = timeline.filter(item => {
        if (timelineFilter === 'all') return true;
        if (timelineFilter === 'notes') return ['internal_note', 'call_log', 'whatsapp_msg', 'email_sent'].includes(item.type);
        if (timelineFilter === 'system') return item.type === 'system_event';
        return true;
    });

    // Derived state
    const lead = data?.profile;

    const refreshData = async () => {
        try {
            const res = await fetch(`/api/admin/leads/${params.id}`);
            const json = await res.json();
            if (json.success) setData(json.data);
        } catch (e) { console.error(e); }
    };

    const handleLogActivity = async (type: string = 'internal_note', contentVal?: string) => {
        const finalContent = contentVal || noteContent;
        if (!finalContent.trim()) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: lead.id,
                    type: type,
                    content: finalContent
                })
            });

            if (res.ok) {
                setNoteContent("");
                await refreshData(); // Re-fetch timeline
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleQuickAction = (action: string) => {
        if (action === 'call') {
            handleLogActivity('call_log', `Outgoing call initiated to ${lead.phone}`);
            window.location.href = `tel:${lead.phone}`;
        }
        if (action === 'whatsapp') {
            // Log the click
            handleLogActivity('whatsapp_msg', `Opened WhatsApp chat with ${lead.name}`);
            window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank');
        }
        if (action === 'proposal') {
            handleLogActivity('system_event', `Started creating a new proposal.`);
            // In future: Redirect to proposal builder
        }
    };

    const updateLead = async (field: string, value: string | number) => {
        // Optimistic Update
        const oldData = { ...data! };
        setData({
            ...data!,
            profile: { ...data!.profile, [field]: value }
        });

        try {
            const res = await fetch(`/api/admin/leads/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) throw new Error("Update failed");

            // Log the change
            handleLogActivity('system_event', `Updated ${field} to ${value}`);
        } catch (error) {
            console.error(error);
            setData(oldData); // Revert
        }
    };



    const handleCreateTask = async () => {
        if (!newTaskTitle) return;

        let finalDate = newTaskDate;
        if (newTaskDate && newTaskTime) {
            finalDate = `${newTaskDate} ${newTaskTime}:00`;
        } else if (newTaskDate) {
            finalDate = `${newTaskDate} 00:00:00`;
        }

        try {
            await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTaskTitle,
                    due_date: finalDate, // Send combined datetime
                    priority: newTaskPriority,
                    customer_id: lead.id
                })
            });
            setTaskDialogOpen(false);
            setNewTaskTitle("");
            setNewTaskDate("");
            setNewTaskTime("");
            refreshData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateDeal = async () => {
        if (!newDealAmount) return;
        try {
            await fetch('/api/admin/deals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: newDealAmount,
                    status: newDealStatus,
                    customer_id: lead.id
                })
            });
            setDealDialogOpen(false);
            setNewDealAmount("");
            refreshData();
        } catch (e) {
            console.error(e);
        }
    };

    const toggleTask = async (taskId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'open' : 'done';

        // Optimistic
        const oldData = { ...data! };
        const newTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        setData({ ...data!, tasks: newTasks });

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: newStatus })
            });
        } catch (e) {
            setData(oldData);
        }
    };

    const updateTask = async (taskId: number, field: string, value: string) => {
        // Optimistic
        const oldData = { ...data! };
        const newTasks = tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t);
        setData({ ...data!, tasks: newTasks });

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, [field]: value })
            });
        } catch (e) {
            setData(oldData);
        }
    };

    const updateDeal = async (dealId: number, field: string, value: string) => {
        // Optimistic
        const oldData = { ...data! };
        const newDeals = deals.map(d => d.id === dealId ? { ...d, [field]: value } : d);
        setData({ ...data!, deals: newDeals });

        try {
            await fetch('/api/admin/deals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: dealId, [field]: value })
            });
            handleLogActivity('system_event', `Updated Deal #${dealId} ${field} to ${value}`);
        } catch (e) {
            setData(oldData);
        }
    };

    const handleAddFile = async () => {
        if (!fileName || !fileUrl) return;
        try {
            await fetch('/api/admin/files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: lead.id,
                    file_name: fileName,
                    file_url: fileUrl,
                    file_type: 'link'
                })
            });
            setFileDialogOpen(false);
            setFileName("");
            setFileUrl("");
            refreshData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreateProposal = async () => {
        if (!proposalTitle || !proposalAmount) {
            alert("Please fill in all fields");
            return;
        }
        try {
            const res = await fetch('/api/admin/proposals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: lead.id,
                    title: proposalTitle,
                    amount: proposalAmount,
                    content: proposalContent
                })
            });
            const json = await res.json();
            if (!json.success) {
                alert("Failed: " + json.message);
                return;
            }

            setProposalDialogOpen(false);
            setProposalTitle("");
            setProposalAmount("");
            setProposalContent("");
            refreshData();
            alert("Proposal Created Successfully!");
        } catch (e) {
            console.error(e);
            alert("Error creating proposal");
        }
    };

    // Helper to safe parse tags
    const getTags = () => {
        try {
            if (typeof lead.tags === 'string') return JSON.parse(lead.tags);
            if (Array.isArray(lead.tags)) return lead.tags;
            return [];
        } catch { return []; }
    };

    // Helper for URLs
    const formatUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        return `https://${url}`;
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">
            <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-4 overflow-hidden">
                                {lead.avatar_url ? (
                                    <img src={lead.avatar_url} alt={lead.name} className="w-full h-full object-cover" />
                                ) : (
                                    lead.name.charAt(0)
                                )}
                            </div>
                            <Select
                                value={lead.score}
                                onValueChange={(val) => updateLead('score', val)}
                            >
                                <SelectTrigger className="w-[100px] h-8 text-xs uppercase tracking-wide border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 p-2 rounded-md">
                                    <SelectValue placeholder="Score" />
                                </SelectTrigger>
                                <SelectContent>
                                    {scores.map(score => (
                                        <SelectItem key={score.id} value={score.value}>
                                            {score.label} {score.emoji}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => setEditProfileOpen(true)}>
                                <FileText className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardTitle className="text-xl">{lead.name}</CardTitle>
                        {lead.location && (
                            <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {lead.location}
                            </div>
                        )}
                        <CardDescription className="flex items-center gap-2 mt-2">
                            <Select
                                value={lead.stage}
                                onValueChange={(val) => updateLead('stage', val)}
                            >
                                <SelectTrigger className="h-8 border text-sm p-2 bg-background hover:bg-muted/50 w-[160px] rounded-md">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full inline-block ${lead.stage === 'won' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                        <SelectValue placeholder="Stage" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {stages.map(stage => (
                                        <SelectItem key={stage.id} value={stage.value}>
                                            {stage.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 text-sm">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Mail className="w-4 h-4" />
                                <span className="text-foreground truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span className="text-foreground">{lead.phone}</span>
                            </div>

                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>Added {new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-muted-foreground">TAGS</p>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-5 text-[10px] text-muted-foreground hover:text-primary px-1">
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Manage Tags</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add a tag..."
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value.trim();
                                                            if (val) {
                                                                const currentTags = getTags();
                                                                if (!currentTags.includes(val)) {
                                                                    const newTags = [...currentTags, val];
                                                                    updateLead('tags', JSON.stringify(newTags));
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button size="icon" variant="ghost" className="shrink-0">
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {getTags().map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 group">
                                                        <span>#{tag}</span>
                                                        <button
                                                            onClick={() => {
                                                                const newTags = getTags().filter((t: string) => t !== tag);
                                                                updateLead('tags', JSON.stringify(newTags));
                                                            }}
                                                            className="ml-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-full p-0.5 text-muted-foreground hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <Button onClick={() => document.querySelector('[data-state="open"]')?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))} variant="outline" size="sm">Done</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {getTags().length > 0 ? getTags().map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                                        #{tag}
                                    </Badge>
                                )) : <span className="text-xs text-muted-foreground">No tags</span>}
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2">OWNER</p>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-xs">A</div>
                                {lead.owner || 'Unassigned'}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleQuickAction('call')}>
                            <PhoneCall className="w-4 h-4" /> Log Call
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => openCompose({ to: lead?.email, customerId: lead?.id })}>
                            <Mail className="w-4 h-4" /> Send Email
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleQuickAction('whatsapp')}>
                            <MessageSquare className="w-4 h-4" /> WhatsApp
                        </Button>
                        <Dialog open={proposalDialogOpen} onOpenChange={setProposalDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start gap-2">
                                    <FileText className="w-4 h-4" /> Create Proposal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Create New Proposal</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Project / Proposal Title</Label>
                                        <Input placeholder="e.g. Website Redesign..." value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Estimated Amount (₹)</Label>
                                        <Input type="number" placeholder="50000" value={proposalAmount} onChange={e => setProposalAmount(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Scope / Description</Label>
                                        <Textarea placeholder="Outline the deliverables..." value={proposalContent} onChange={e => setProposalContent(e.target.value)} />
                                    </div>
                                    <Button onClick={handleCreateProposal} className="w-full">Generate Proposal Draft</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {/* Notes Card - Always Visible for direct editing */}
                <Card className="bg-amber-50/50 border-amber-200">
                    <CardHeader className="py-3 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-800">
                            <StickyNote className="w-4 h-4" /> Notes
                        </CardTitle>
                        {!isEditingNotes && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                                onClick={() => {
                                    setTempNotes(lead.notes || '');
                                    setIsEditingNotes(true);
                                }}
                            >
                                <Pencil className="h-3 w-3" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="text-xs text-amber-900/80 leading-relaxed">
                        {isEditingNotes ? (
                            <div className="space-y-2">
                                <Textarea
                                    value={tempNotes}
                                    onChange={(e) => setTempNotes(e.target.value)}
                                    className="min-h-[100px] bg-white border-amber-300 focus-visible:ring-amber-400 placeholder:text-amber-300 text-amber-900"
                                    placeholder="Add notes..."
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsEditingNotes(false)}
                                        className="h-7 text-xs hover:bg-amber-100 text-amber-800"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSaveNotes}
                                        className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white border-none"
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="whitespace-pre-wrap min-h-[20px] cursor-pointer hover:bg-amber-100/50 rounded p-1 -ml-1 transition-colors"
                                onClick={() => {
                                    setTempNotes(lead.notes || '');
                                    setIsEditingNotes(true);
                                }}
                            >
                                {lead.notes ? (
                                    lead.notes
                                ) : (
                                    <span className="italic opacity-50 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Click to add notes...
                                    </span>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Ad Intelligence Card */}
                {(lead.platform || lead.campaign_name || lead.ad_name || lead.form_name) && (
                    <Card>
                        <CardHeader className="py-4">
                            <CardTitle className="text-sm font-medium">Ad Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 text-xs">
                            {lead.platform && (
                                <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md">
                                    <span className="text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">Platform</span>
                                    <Badge variant="secondary" className="uppercase text-[10px] h-5">{lead.platform}</Badge>
                                </div>
                            )}
                            {lead.campaign_name && (
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider font-semibold">Campaign</span>
                                    <span className="font-medium block leading-tight">{lead.campaign_name}</span>
                                </div>
                            )}
                            {lead.ad_name && (
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider font-semibold">Ad Creative</span>
                                    <span className="font-medium block leading-tight">{lead.ad_name}</span>
                                </div>
                            )}
                            {lead.adset_name && (
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider font-semibold">Ad Set</span>
                                    <span className="font-medium block leading-tight">{lead.adset_name}</span>
                                </div>
                            )}
                            {lead.form_name && (
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-[10px] uppercase tracking-wider font-semibold">Form</span>
                                    <span className="font-medium block leading-tight">{lead.form_name}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* System Data Card */}
                <Card>
                    <CardHeader className="py-2">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">System Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-xs text-muted-foreground">
                        <div className="flex justify-between border-b pb-1 border-border/50">
                            <span>Internal ID</span>
                            <span className="font-mono">{lead.id}</span>
                        </div>
                        {lead.fb_lead_id && (
                            <div className="flex justify-between border-b pb-1 border-border/50">
                                <span>FB Lead ID</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-mono text-[10px] truncate max-w-[80px]" title={lead.fb_lead_id}>{lead.fb_lead_id}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>Created</span>
                            <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                        {lead.fb_created_time && (
                            <div className="flex justify-between">
                                <span>FB Time</span>
                                <span>{new Date(lead.fb_created_time).toLocaleDateString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* MIDDLE COLUMN: Deals & Tasks (5 Cols) */}
            <div className="col-span-5 flex flex-col gap-6 overflow-y-auto pr-2">

                {/* ACTIVE PROJECT STATUS (Visual Tracker) */}
                {deals.length > 0 && (
                    <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Rocket className="w-24 h-24" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Active Project Tracker</CardTitle>
                            <CardDescription className="text-slate-400 text-xs">
                                Showing status for latest deal: <span className="text-white font-bold">#{deals[0].id}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="flex items-center justify-between relative mt-2">
                                {['initiated', 'paid', 'processing', 'delivered'].map((step, i, arr) => {
                                    const currentStatus = deals[0].status;
                                    const stepIndex = arr.indexOf(step);
                                    const curIndex = arr.indexOf(currentStatus);
                                    const isCompleted = stepIndex <= curIndex;
                                    const isCurrent = stepIndex === curIndex;

                                    return (
                                        <div
                                            key={step}
                                            onClick={() => updateDeal(deals[0].id, 'status', step)}
                                            className="flex flex-col items-center relative z-10 w-full cursor-pointer group"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isCompleted ? 'bg-green-500 text-white shadow-lg shadow-green-900/20' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                                                } ${isCurrent ? 'ring-2 ring-white scale-110' : ''}`}>
                                                {isCompleted && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                            </div>
                                            <span className={`text-[10px] mt-2 font-medium uppercase tracking-wide transition-colors ${isCompleted ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-400'
                                                }`}>
                                                {step.replace('_', ' ')}
                                            </span>

                                            {/* Connector Line */}
                                            {i !== arr.length - 1 && (
                                                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 transition-colors duration-500 ${stepIndex < curIndex ? 'bg-green-500' : 'bg-slate-800'
                                                    }`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Deals Section */}
                <Card>
                    <CardHeader className="py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Deals & Proposals</CardTitle>
                        <Dialog open={dealDialogOpen} onOpenChange={setDealDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Create New Deal</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Amount (₹)</Label>
                                        <Input type="number" value={newDealAmount} onChange={e => setNewDealAmount(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Initial Status</Label>
                                        <Select value={newDealStatus} onValueChange={setNewDealStatus}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[10005]">
                                                <SelectItem value="getting_ready">Draft/Proposal</SelectItem>
                                                <SelectItem value="initiated">Initiated</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleCreateDeal}>Create Deal</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {deals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No active deals.</p>}
                        {deals.map(deal => (
                            <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                <div>
                                    <div className="font-semibold text-sm">Deal #{deal.id}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(deal.created_at).toLocaleDateString()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm">₹{deal.amount}</div>
                                    <Select value={deal.status} onValueChange={(val) => updateDeal(deal.id, 'status', val)}>
                                        <SelectTrigger className="h-6 w-[90px] text-[10px] border-none p-0 justify-end shadow-none hover:bg-transparent">
                                            <Badge variant={(deal.status === 'paid' || deal.status === 'won') ? 'default' : 'secondary'} className="h-5 px-2 hover:bg-primary/90 pointer-events-none">
                                                {deal.status}
                                            </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="getting_ready">Reviewing</SelectItem>
                                            <SelectItem value="initiated">Initiated</SelectItem>
                                            <SelectItem value="paid">Paid ✅</SelectItem>
                                            <SelectItem value="cancelled">Cancelled ❌</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Follow-ups Section */}
                <Card className="flex-1">
                    <CardHeader className="py-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Tasks & Follow-ups</CardTitle>
                        <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Task Title</Label>
                                        <Input placeholder="Follow up call..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Due Date</Label>
                                            <Input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Time</Label>
                                            <Input type="time" value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Priority</Label>
                                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent className="z-[9999]">
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleCreateTask}>Save Task</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-0">
                        {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending tasks.</p>}
                        {tasks.map((task, i) => (
                            <div key={task.id} className={`flex items-start gap-3 p-3 ${i !== tasks.length - 1 ? 'border-b' : ''}`}>
                                <button
                                    onClick={() => toggleTask(task.id, task.status)}
                                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300 hover:border-zinc-400'}`}
                                >
                                    {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                                <div className="flex-1">
                                    <p className={`text-sm font-medium ${task.status === 'done' && 'line-through text-muted-foreground'}`}>{task.title}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Select value={task.priority} onValueChange={(val) => updateTask(task.id, 'priority', val)}>
                                            <SelectTrigger className="h-4 p-0 border-none shadow-none w-auto">
                                                <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 hover:bg-muted cursor-pointer ${task.priority === 'high' ? 'text-red-500 border-red-200 bg-red-50' : ''}`}>
                                                    {task.priority || 'Normal'}
                                                </Badge>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {task.due_date && <div className={`flex items-center gap-1 text-[10px] ${task.status !== 'done' && 'text-red-500 font-medium'}`}>
                                            <Clock className="w-3 h-3" />
                                            {new Date(task.due_date).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: Timeline & Communication (4 Cols) */}
            <div className="col-span-4 flex flex-col h-full overflow-hidden">
                <Card className="h-full flex flex-col shadow-none border-l-0 rounded-l-none bg-transparent">
                    <Tabs defaultValue="timeline" className="flex-1 flex flex-col h-full">
                        <div className="px-4 pt-4 shrink-0">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                                <TabsTrigger value="emails">Emails</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="timeline" className="flex-1 flex flex-col overflow-hidden mt-0">
                            {/* Timeline Filters */}
                            <div className="px-4 py-2 border-b bg-zinc-50/50 flex gap-2 shrink-0">
                                <Button
                                    variant={timelineFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimelineFilter('all')}
                                    className="h-7 text-xs rounded-full"
                                >
                                    All
                                </Button>
                                <Button
                                    variant={timelineFilter === 'notes' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimelineFilter('notes')}
                                    className="h-7 text-xs rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                                >
                                    Notes & Calls
                                </Button>
                                <Button
                                    variant={timelineFilter === 'system' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimelineFilter('system')}
                                    className="h-7 text-xs rounded-full bg-zinc-100 text-zinc-700 hover:bg-zinc-200 border-zinc-200"
                                >
                                    System Activity
                                </Button>
                            </div>

                            {/* Feed - Scrollable Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {filteredTimeline.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity found.</p>}
                                {filteredTimeline.map((item, i) => (
                                    <div key={item.id} className="flex gap-4 relative">
                                        {/* Line connector */}
                                        {i !== filteredTimeline.length - 1 && (
                                            <div className="absolute left-4 top-8 bottom-[-24px] w-px bg-zinc-200 dark:bg-zinc-800"></div>
                                        )}

                                        {/* Admin Avatar with Initials */}
                                        {item.created_by_name ? (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 text-white text-xs font-bold
                                                ${item.created_by_name === 'Admin User' ? 'bg-blue-500' :
                                                    item.created_by_name === 'John Doe' ? 'bg-green-500' :
                                                        item.created_by_name === 'Sarah Smith' ? 'bg-purple-500' : 'bg-gray-500'}`}>
                                                {item.created_by_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 
                                                ${item.type === 'call_log' ? 'bg-blue-100 text-blue-600' :
                                                    item.type === 'whatsapp_msg' ? 'bg-green-100 text-green-600' :
                                                        item.type === 'system_event' ? 'bg-zinc-100 text-zinc-600' : 'bg-purple-100 text-purple-600'}`}>
                                                {item.type === 'call_log' && <PhoneCall className="w-4 h-4" />}
                                                {item.type === 'whatsapp_msg' && <MessageSquare className="w-4 h-4" />}
                                                {item.type === 'system_event' && <FileText className="w-4 h-4" />}
                                            </div>
                                        )}

                                        <div className="flex-1 pb-6">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm">{item.created_by_name || 'System'}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border p-3 rounded-lg shadow-sm">
                                                {formatTimelineMessage(item.content, item.type)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area - Fixed at Bottom */}
                            <div className="lead-profile-timeline-input p-4 bg-zinc-50 dark:bg-zinc-900 border-t shrink-0">
                                <Textarea
                                    placeholder="Type a note, or log a call..."
                                    className="min-h-[80px] mb-2 bg-white dark:bg-black"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <Button size="sm" className="gap-2" onClick={() => handleLogActivity()} disabled={submitting}>
                                            <Send className="w-3 h-3" /> {submitting ? 'Saving...' : 'Log Activity'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="files" className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-semibold">Attachments & Links</h3>
                                <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Link</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Add File or Link</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid gap-2">
                                                <Label>File Name</Label>
                                                <Input placeholder="Proposal V1..." value={fileName} onChange={e => setFileName(e.target.value)} />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>URL / Link</Label>
                                                <Input placeholder="https://docs.google.com/..." value={fileUrl} onChange={e => setFileUrl(e.target.value)} />
                                            </div>
                                            <Button onClick={handleAddFile}>Save Attachment</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>



                            <div className="space-y-2">
                                {(files || []).length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No files uploaded yet.</p>}
                                {(files || []).map(file => (
                                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                                                <Paperclip className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <a href={formatUrl(file.file_url)} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline block">{file.file_name}</a>
                                                <span className="text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <a href={formatUrl(file.file_url)} target="_blank" rel="noreferrer">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground"><Globe className="w-4 h-4" /></Button>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="emails" className="flex-1 flex flex-col h-full overflow-hidden">
                            <div className="p-4 border-b bg-zinc-50/50 flex justify-between items-center shrink-0">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email History</span>
                                <Button size="sm" className="h-8 border-none bg-[#0B0B0B] text-white hover:bg-[#1A1A1A]" onClick={() => openCompose({ to: lead?.email, customerId: lead?.id })}>
                                    <Plus className="w-4 h-4 mr-2" /> New Email
                                </Button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {(data.emails || []).length === 0 ? (
                                    <div className="text-center py-20 text-muted-foreground italic">No email history found.</div>
                                ) : (
                                    data.emails.map((email: any) => (
                                        <div key={email.id} className="bg-white dark:bg-zinc-950 border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex flex-col">
                                                    <Badge variant="outline" className={`w-fit text-[9px] h-4 mb-2 ${email.from.includes(lead.email) ? 'bg-zinc-100' : 'bg-primary/5 text-primary border-primary/20'}`}>
                                                        {email.from.includes(lead.email) ? 'INCOMING' : 'OUTGOING'}
                                                    </Badge>
                                                    <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{email.subject || '(No Subject)'}</h4>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{email.textSnippet || email.text || 'No content preview'}</p>
                                            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-900/50 gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100"
                                                    onClick={() => {
                                                        openCompose({
                                                            to: email.from.includes(lead.email) ? email.from : email.to,
                                                            subject: `Re: ${email.subject}`,
                                                            body: `\n\n--- On ${new Date(email.date).toLocaleString()}, ${email.from} wrote: ---\n\n${email.textSnippet || email.text}`
                                                        });
                                                    }}
                                                >
                                                    <Rocket className="w-3 h-3 mr-2 text-primary" /> Reply
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Edit Profile Modal */}
                    <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Lead Profile</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                {/* Basic Info */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-primary rounded-full"></div> Basic Information</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input value={lead.name} onChange={(e) => updateLead('name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input value={lead.email} onChange={(e) => updateLead('email', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input value={lead.phone} onChange={(e) => updateLead('phone', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Location</Label>
                                            <Input value={lead.location || ''} onChange={(e) => updateLead('location', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Budget</Label>
                                            <Input type="number" value={lead.budget || ''} onChange={(e) => updateLead('budget', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>LTV (Lifetime Value)</Label>
                                            <Input type="number" value={lead.ltv || ''} onChange={(e) => updateLead('ltv', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Ad Intelligence */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div> Ad Intelligence (Manual Override)</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Campaign Name</Label>
                                            <Input value={lead.campaign_name || ''} onChange={(e) => updateLead('campaign_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ad Set Name</Label>
                                            <Input value={lead.adset_name || ''} onChange={(e) => updateLead('adset_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Ad Name</Label>
                                            <Input value={lead.ad_name || ''} onChange={(e) => updateLead('ad_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Platform</Label>
                                            <Select value={lead.platform || ''} onValueChange={(v) => updateLead('platform', v)}>
                                                <SelectTrigger><SelectValue placeholder="Unknown" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ig">Instagram</SelectItem>
                                                    <SelectItem value="fb">Facebook</SelectItem>
                                                    <SelectItem value="google">Google</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Form Name</Label>
                                            <Input value={lead.form_name || ''} onChange={(e) => updateLead('form_name', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Lead Status (FB)</Label>
                                            <Input value={lead.fb_lead_status || ''} onChange={(e) => updateLead('fb_lead_status', e.target.value)} />
                                        </div>
                                    </div>
                                </div>

                                <Separator />


                                {/* System IDs */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2"><div className="w-1 h-4 bg-zinc-500 rounded-full"></div> System Identifiers</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Facebook Lead ID</Label>
                                            <Input value={lead.fb_lead_id || ''} onChange={(e) => updateLead('fb_lead_id', e.target.value)} className="font-mono text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Notes</Label>
                                            <Textarea value={lead.notes || ''} onChange={(e) => updateLead('notes', e.target.value)} className="min-h-[80px]" />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </DialogContent>
                    </Dialog>
                </Card >
            </div>
            {/* Removed Local ComposeModal - Using Global Provider */}
        </div >
    );
}
