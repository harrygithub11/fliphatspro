'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, MapPin, Calendar, ExternalLink, MessageSquare, StickyNote, Plus, Clock, Activity } from 'lucide-react';
import Link from 'next/link';
import { useComposeEmail } from '@/context/ComposeEmailContext';

interface LeadPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: number | null;
    initialData?: any; // Snapshot from list
    stages: any[];
    scores: any[];
    admins: any[];
    onUpdate?: () => void; // Trigger refresh in parent
}

export function LeadPreviewModal({ open, onOpenChange, leadId, initialData, stages, scores, admins, onUpdate }: LeadPreviewModalProps) {
    const { openCompose } = useComposeEmail();
    const [loading, setLoading] = useState(false);
    const [details, setDetails] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('timeline');
    const [note, setNote] = useState('');
    const [submittingNote, setSubmittingNote] = useState(false);

    // Fetch full details when modal opens with a new leadId
    useEffect(() => {
        if (open && leadId) {
            setLoading(true);
            setDetails(null); // Reset
            fetch(`/api/admin/leads/${leadId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setDetails(data.data);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [open, leadId]);

    const handleUpdate = async (field: string, value: any) => {
        if (!leadId) return;

        // Optimistic update for UI smoothness (if we had local state for it, but here we rely on refresh or just wait)
        try {
            await fetch(`/api/admin/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
            if (onUpdate) onUpdate();
            // Refresh local details
            const res = await fetch(`/api/admin/leads/${leadId}`);
            const data = await res.json();
            if (data.success) setDetails(data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddNote = async () => {
        if (!note.trim() || !leadId) return;
        setSubmittingNote(true);
        try {
            await fetch('/api/admin/interactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: leadId,
                    type: 'internal_note',
                    content: note
                })
            });
            setNote('');
            // Refresh timeline
            const res = await fetch(`/api/admin/leads/${leadId}`);
            const data = await res.json();
            if (data.success) setDetails(data.data);
            if (onUpdate) onUpdate(); // To maybe update "last activity" in list
        } catch (e) {
            console.error(e);
        } finally {
            setSubmittingNote(false);
        }
    };

    const lead = details?.profile || initialData || {};
    const timeline = details?.timeline || [];

    if (!leadId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[700px] h-[85vh] max-w-[95vw] grid grid-rows-[auto_auto_1fr_auto] grid-cols-[100%] p-0 gap-0 overflow-hidden overflow-x-hidden">
                {/* Header Profile Section */}
                <div className="bg-muted/30 p-6 pr-10 border-b shrink-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4">
                            <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                                <AvatarImage src={lead.avatar_url} />
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                    {lead.name ? lead.name.substring(0, 2).toUpperCase() : '??'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {lead.name}
                                    <Link href={`/admin/leads/${leadId}`} className="text-muted-foreground hover:text-primary transition-colors">
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </DialogTitle>
                                <div className="text-sm text-muted-foreground flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-3">
                                        {lead.email && (
                                            <button
                                                onClick={() => openCompose({ to: lead.email })}
                                                className="flex items-center gap-1.5 hover:text-primary transition-colors group"
                                            >
                                                <Mail className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary" />
                                                <span className="underline decoration-muted-foreground/30 underline-offset-2">{lead.email}</span>
                                            </button>
                                        )}
                                        {lead.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {lead.phone}</span>}
                                    </div>
                                    {lead.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {lead.location}</div>}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 items-end shrink-0">
                            {/* Status & Score Row */}
                            <div className="flex items-center gap-2">
                                <Select value={lead?.stage} onValueChange={(v) => handleUpdate('stage', v)}>
                                    <SelectTrigger className="h-8 w-[140px] text-xs bg-background">
                                        <SelectValue placeholder="Stage" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stages.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={lead?.score} onValueChange={(v) => handleUpdate('score', v)}>
                                    <SelectTrigger className="h-8 w-[100px] text-xs bg-background">
                                        <SelectValue placeholder="Score" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {scores.map(s => <SelectItem key={s.id} value={s.value}>{s.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Owner Row */}
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Owner</span>
                                <Select value={lead?.owner} onValueChange={(v) => handleUpdate('owner', v)}>
                                    <SelectTrigger className="h-7 text-xs border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 p-1 px-2 rounded-md shadow-none w-fit min-w-[fit-content] justify-end gap-2 ring-0 focus:ring-0">
                                        <SelectValue placeholder="Unassigned">
                                            {lead?.owner && lead.owner !== 'unassigned' ? (
                                                <div className="flex items-center gap-2">
                                                    {(() => {
                                                        const admin = admins.find(a => a.name === lead.owner);
                                                        return (
                                                            <>
                                                                <Avatar className="h-4 w-4">
                                                                    <AvatarImage src={admin?.avatar_url} />
                                                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                                        {lead.owner.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium truncate max-w-[100px]">{lead.owner}</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Unassigned</span>
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent align="end">
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {admins.map(a => (
                                            <SelectItem key={a.id} value={a.name}>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={a.avatar_url} />
                                                        <AvatarFallback className="text-[9px]">{a.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span>{a.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Tabs - Spans 2 grid rows (tabs header + content) */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="contents">
                    <div className="px-6 border-b shrink-0 bg-white dark:bg-zinc-950/50">
                        <TabsList className="h-10 bg-transparent p-0 -mb-px">
                            <TabsTrigger value="timeline" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-10 bg-transparent">
                                <Activity className="w-4 h-4 mr-2" /> Activity
                            </TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-10 bg-transparent">
                                <StickyNote className="w-4 h-4 mr-2" /> Notes
                            </TabsTrigger>
                            <TabsTrigger value="emails" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-10 bg-transparent">
                                <Mail className="w-4 h-4 mr-2" /> Emails
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="overflow-y-auto overflow-x-hidden bg-zinc-50/50 dark:bg-zinc-900/50 w-full min-w-0">
                        {activeTab === 'timeline' && (
                            <div className="flex flex-col">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        <Clock className="w-4 h-4 animate-spin mr-2" /> Loading timeline...
                                    </div>
                                ) : (
                                    <>
                                        {/* Quick Note Input - Fixed at Top */}
                                        <div className="p-4 border-b bg-white dark:bg-zinc-900 shrink-0 z-10 shadow-sm">
                                            <div className="flex gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                                                    <MessageSquare className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-2">
                                                    <Textarea
                                                        placeholder="Add a quick note or update..."
                                                        className="min-h-[80px] text-sm resize-none bg-background font-normal focus-visible:ring-1"
                                                        value={note}
                                                        onChange={e => setNote(e.target.value)}
                                                    />
                                                    <div className="flex justify-end">
                                                        <Button size="sm" onClick={handleAddNote} disabled={submittingNote}>
                                                            {submittingNote ? 'Saving...' : 'Post Note'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 pb-8 min-w-0 w-full">
                                            <div className="relative pl-4 border-l border-border/60 space-y-8 min-w-0">
                                                {timeline.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground pl-4 italic">No activity yet.</div>
                                                ) : (
                                                    timeline.map((item: any) => (
                                                        <div key={item.id} className="relative pl-6 group">
                                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-200 border-2 border-white dark:border-zinc-950 dark:bg-zinc-700 group-hover:bg-primary transition-colors"></div>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <span className="font-medium text-foreground">{item.created_by_name || 'System'}</span>
                                                                    <span>•</span>
                                                                    <span>{new Date(item.created_at).toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words overflow-hidden">{item.content}</p>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="p-6 pb-8">
                                <Textarea
                                    value={details?.profile?.notes || (initialData?.notes) || ''}
                                    onChange={(e) => {
                                        if (details?.profile) {
                                            setDetails({ ...details, profile: { ...details.profile, notes: e.target.value } });
                                        }
                                    }}
                                    onBlur={(e) => handleUpdate('notes', e.target.value)}
                                    className="min-h-[400px] border-none focus-visible:ring-0 bg-transparent resize-none p-0 text-base leading-relaxed placeholder:text-muted-foreground/50"
                                    placeholder="Start typing complex notes here..."
                                />
                            </div>
                        )}

                        {activeTab === 'emails' && (
                            <div className="p-6 pb-8">
                                <div className="space-y-4">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-10">
                                            <Clock className="w-4 h-4 animate-spin mr-2" /> Loading emails...
                                        </div>
                                    ) : (details?.emails || []).length === 0 ? (
                                        <div className="text-center py-10 text-muted-foreground italic">No emails found for this lead.</div>
                                    ) : (
                                        <div className="space-y-3">
                                            {details.emails.map((email: any) => (
                                                <div key={email.id} className="bg-white dark:bg-zinc-950 border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-all group">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                                                {email.from.includes(lead.email) ? 'RECEIVED' : 'SENT'}
                                                            </span>
                                                            <h4 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{email.subject || '(No Subject)'}</h4>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(email.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{email.textSnippet || email.text || 'No content preview'}</p>
                                                    <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-900">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openCompose({
                                                                    to: email.from.includes(lead.email) ? email.from : email.to,
                                                                    subject: `Re: ${email.subject}`,
                                                                    body: `\n\n--- On ${new Date(email.date).toLocaleString()}, ${email.from} wrote: ---\n\n${email.textSnippet || email.text}`
                                                                });
                                                            }}
                                                        >
                                                            <Mail className="w-3 h-3 mr-2" /> Reply
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-background shrink-0 flex justify-between items-center z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <span className="text-xs text-muted-foreground">
                            Last updated: {details?.profile ? new Date(details.profile.created_at).toLocaleDateString() : 'Just now'}
                        </span>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openCompose({ to: lead.email })} className="text-secondary-foreground hover:bg-secondary">
                                <Mail className="w-4 h-4 mr-2" /> Send Email
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                            <Button size="sm" asChild>
                                <Link href={`/admin/leads/${leadId}`}>Full Profile</Link>
                            </Button>
                        </div>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
