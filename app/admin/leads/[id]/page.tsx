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
    Plus, Send, Paperclip, Rocket
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    created_at: string;
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
        fetchProfile();
    }, [params.id]);

    if (loading) return <div className="p-10 text-center">Loading 360 View...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Lead not found.</div>;

    const { profile: lead, deals, tasks, timeline, files } = data;

    // Refresh data helper
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

    const updateLead = async (field: string, value: string) => {
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
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-8rem)]">

            {/* LEFT COLUMN: Profile & Contact Info (3 Cols) */}
            <div className="col-span-3 flex flex-col gap-6 overflow-y-auto pr-2">
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-4">
                                {lead.name.charAt(0)}
                            </div>
                            <Select
                                value={lead.score}
                                onValueChange={(val) => updateLead('score', val)}
                            >
                                <SelectTrigger className="w-[100px] h-8 text-xs uppercase tracking-wide border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 p-2 rounded-md">
                                    <SelectValue placeholder="Score" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hot">HOT 🔥</SelectItem>
                                    <SelectItem value="warm">WARM 🌤️</SelectItem>
                                    <SelectItem value="cold">COLD ❄️</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <CardTitle className="text-xl">{lead.name}</CardTitle>
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
                                    <SelectItem value="new">New Lead</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                                    <SelectItem value="negotiation">Negotiation</SelectItem>
                                    <SelectItem value="won">Won Deal 💰</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
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
                            <p className="text-xs font-semibold text-muted-foreground mb-2">TAGS</p>
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
                                            <SelectContent>
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
                                            <SelectContent>
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
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="files">Files</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="timeline" className="flex-1 flex flex-col overflow-hidden mt-0">
                            {/* Feed */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {timeline.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No history yet.</p>}
                                {timeline.map((item, i) => (
                                    <div key={item.id} className="flex gap-4 relative">
                                        {/* Line connector */}
                                        {i !== timeline.length - 1 && (
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

                                        <div className="flex-1 pb-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold">{item.created_by_name || 'System'}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleTimeString()}</span>
                                            </div>
                                            <div className="text-xs bg-white dark:bg-zinc-900 border p-3 rounded-lg mt-1 shadow-sm">
                                                {formatTimelineMessage(item.content, item.type)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t shrink-0">
                                <Textarea
                                    placeholder="Type a note, or log a call..."
                                    className="min-h-[80px] mb-2 bg-white dark:bg-black"
                                    value={noteContent}
                                    onChange={(e) => setNoteContent(e.target.value)}
                                />
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Paperclip className="w-4 h-4" /></Button>
                                    </div>
                                    <Button size="sm" className="gap-2" onClick={() => handleLogActivity()} disabled={submitting}>
                                        <Send className="w-3 h-3" /> {submitting ? 'Saving...' : 'Log Activity'}
                                    </Button>
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
                    </Tabs>
                </Card>
            </div>
        </div>
    );
}
