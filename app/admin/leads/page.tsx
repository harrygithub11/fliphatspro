'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Mail, Phone, MoreHorizontal, Plus } from 'lucide-react';
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

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    source: string;
    score: 'hot' | 'warm' | 'cold';
    stage: 'new' | 'contacted' | 'won' | 'lost';
    owner: string;
    created_at: string;
    order_status?: string;
    order_source?: string;
}

export default function LeadsPage() {
    const [leads, setLeads] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sourceFilter, setSourceFilter] = useState('all');

    // New Lead State
    const [newLeadName, setNewLeadName] = useState('');
    const [newLeadEmail, setNewLeadEmail] = useState('');
    const [newLeadPhone, setNewLeadPhone] = useState('');
    const [newLeadSource, setNewLeadSource] = useState('manual');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Team members for assignment
    const [admins, setAdmins] = useState<{ id: number, name: string, email: string }[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: number, name: string, email: string } | null>(null);
    const [showMyLeadsOnly, setShowMyLeadsOnly] = useState(false);

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

        fetchLeads();
        fetchAdmins();
        fetchCurrentUser();
    }, []);

    const getScoreBadge = (score: string) => {
        switch (score) {
            case 'hot': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Hot 🔥</Badge>;
            case 'warm': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Warm 🌤️</Badge>;
            default: return <Badge variant="outline" className="text-muted-foreground">Cold ❄️</Badge>;
        }
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
                    source: newLeadSource
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
                setNewLeadSource('manual');
            } else {
                alert("Failed: " + json.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving lead");
        }
    };

    const getStageBadge = (stage: string) => {
        switch (stage) {
            case 'new': return <Badge variant="secondary">New Lead</Badge>;
            case 'won': return <Badge className="bg-green-100 text-green-700 border-green-200">Won 💰</Badge>;
            case 'lost': return <Badge variant="outline">Lost</Badge>;
            default: return <Badge variant="secondary">{stage}</Badge>;
        }
    };

    const filtered = leads.filter(l => {
        // Search filter
        const matchesSearch = l.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // My Leads filter
        const matchesOwner = !showMyLeadsOnly || (currentUser && l.owner === currentUser.name);

        // Source Filter
        const matchesSource = sourceFilter === 'all' ||
            (l.order_source === sourceFilter) ||
            (l.source === sourceFilter) ||
            (sourceFilter === 'lifetime_12k' && l.order_source === 'lifetime_12k') ||
            (sourceFilter === 'newyear_5k' && l.order_source === 'newyear_5k');

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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Inbox</h1>
                    <p className="text-muted-foreground">The Control Room: Manage and track every potential deal.</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Manual Lead</Button>
                    </DialogTrigger>
                    <DialogContent>
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
                                <Label className="text-right">Source</Label>
                                <Select value={newLeadSource} onValueChange={setNewLeadSource}>
                                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select source" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="manual">Manual Entry</SelectItem>
                                        <SelectItem value="phone">Phone Call</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="referral">Referral</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSaveLead}>Save Lead</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                            <div className="relative w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search via Name, Phone, Email..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
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
                                            <a href={`/admin/leads/${lead.id}`} className="block">
                                                <div className="font-medium text-primary group-hover:underline">{lead.name}</div>
                                                <div className="text-xs text-muted-foreground">{lead.email}</div>
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            {lead.order_source === 'lifetime_12k' ? <Badge className="bg-purple-100 text-purple-700 border-purple-200">12k Offer</Badge> :
                                                lead.order_source === 'newyear_5k' ? <Badge className="bg-red-100 text-red-700 border-red-200">5k Offer</Badge> :
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
                                                    <SelectItem value="hot">
                                                        <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 pointer-events-none">Hot 🔥</Badge>
                                                    </SelectItem>
                                                    <SelectItem value="warm">
                                                        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200 pointer-events-none">Warm 🌤️</Badge>
                                                    </SelectItem>
                                                    <SelectItem value="cold">
                                                        <Badge variant="outline" className="text-muted-foreground pointer-events-none">Cold ❄️</Badge>
                                                    </SelectItem>
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
                                                    <SelectItem value="new"><Badge variant="secondary" className="pointer-events-none">New Lead</Badge></SelectItem>
                                                    <SelectItem value="contacted"><Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200 pointer-events-none">Contacted</Badge></SelectItem>
                                                    <SelectItem value="proposal_sent"><Badge variant="outline" className="text-purple-600 bg-purple-50 border-purple-200 pointer-events-none">Proposed</Badge></SelectItem>
                                                    <SelectItem value="negotiation"><Badge variant="outline" className="text-orange-600 bg-orange-50 border-orange-200 pointer-events-none">Negotiating</Badge></SelectItem>
                                                    <SelectItem value="won"><Badge className="bg-green-100 text-green-700 border-green-200 pointer-events-none">Won 💰</Badge></SelectItem>
                                                    <SelectItem value="lost"><Badge variant="outline" className="pointer-events-none">Lost</Badge></SelectItem>
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
                                                <SelectTrigger className="h-8 w-[140px] border-none shadow-none bg-transparent hover:bg-muted p-1">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">
                                                        <span className="text-muted-foreground italic">Unassigned</span>
                                                    </SelectItem>
                                                    {admins.map(admin => (
                                                        <SelectItem key={admin.id} value={admin.name}>
                                                            {admin.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
        </div>
    );
}
