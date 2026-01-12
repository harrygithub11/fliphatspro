'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Video, Plus, Calendar, Clock, ArrowRight, VideoOff, History, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { toast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function MeetingsDashboard() {
    const [meetings, setMeetings] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const router = useRouter();

    const fetchMeetings = async () => {
        try {
            const res = await fetch('/api/admin/meetings');
            const data = await res.json();
            if (data.success) {
                setMeetings(data.meetings);
            }
        } catch (error) {
            console.error('Failed to fetch meetings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (Array.isArray(data)) {
                setAdmins(data);
            }
        } catch (error) {
            console.error('Failed to fetch admins:', error);
        }
    };

    useEffect(() => {
        fetchMeetings();
        fetchAdmins();
    }, []);

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreateMeeting = async () => {
        if (!newTitle) {
            toast({
                title: "Missing Information",
                description: "Please enter a meeting title.",
                variant: "destructive"
            });
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/admin/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    inviteeIds: selectedUsers
                })
            });
            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Room Created",
                    description: "Redirecting you to the meeting live room...",
                });
                router.push(`/admin/meetings/${data.meeting.id}`);
            } else {
                toast({
                    title: "Creation Failed",
                    description: data.error || data.message || "Something went wrong.",
                    variant: "destructive"
                });
            }
        } catch (error: any) {
            console.error('Failed to create meeting:', error);
            toast({
                title: "Network Error",
                description: "Failed to connect to the meeting server.",
                variant: "destructive"
            });
        } finally {
            setCreating(false);
        }
    };

    const activeMeetings = meetings.filter(m => m.status === 'active');
    const pastMeetings = meetings.filter(m => m.status !== 'active');

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Video Center</h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1 opacity-50">Enterprise-grade communication</p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-12 px-6 bg-[#0B0B0B] text-white hover:bg-[#1A1A1A] rounded-full gap-2 border-none shadow-xl">
                            <Plus className="w-5 h-5" /> Start Instant Call
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Start New Meeting</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Meeting Title</Label>
                                <Input
                                    placeholder="e.g., Client Strategy Session"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="h-12 bg-zinc-50 border-zinc-200"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
                                <Input
                                    placeholder="Discussion about project scope..."
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="h-12 bg-zinc-50 border-zinc-200"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Invitees</Label>
                                <ScrollArea className="h-40 border border-zinc-100 rounded-xl p-3 bg-zinc-50">
                                    <div className="space-y-2">
                                        {admins.length === 0 ? (
                                            <p className="text-[10px] text-muted-foreground italic">No other team members found.</p>
                                        ) : (
                                            admins.map(admin => (
                                                <div key={admin.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`admin-${admin.id}`}
                                                        checked={selectedUsers.includes(admin.id.toString())}
                                                        onCheckedChange={() => toggleUser(admin.id.toString())}
                                                    />
                                                    <label
                                                        htmlFor={`admin-${admin.id}`}
                                                        className="text-xs font-bold uppercase tracking-tight cursor-pointer"
                                                    >
                                                        {admin.name} <span className="text-muted-foreground font-mono font-normal ml-1">({admin.role})</span>
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            <Button
                                onClick={handleCreateMeeting}
                                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-red-900/20"
                                disabled={creating || !newTitle}
                            >
                                {creating ? 'Launching Room...' : 'Go Live Now'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    {/* Active Sessions */}
                    <Card className="border-none shadow-2xl bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-[#0B0B0B] text-white py-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500 rounded-lg animate-pulse">
                                    <Video className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-black uppercase tracking-widest">Active Conferences</CardTitle>
                                    <CardDescription className="text-zinc-500 text-xs font-bold font-mono">Real-time collaboration</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading sessions...</div>
                            ) : activeMeetings.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                                    <VideoOff className="w-12 h-12 opacity-20" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No active calls currently</p>
                                    <Button variant="outline" onClick={() => setCreateOpen(true)} className="rounded-full text-xs font-bold uppercase tracking-widest h-10">Start One Now</Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {activeMeetings.map((meeting) => (
                                        <div key={meeting.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-14 w-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                    <Video className="w-6 h-6 text-zinc-400 group-hover:text-primary transition-colors" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-lg group-hover:text-primary transition-colors uppercase tracking-tighter">{meeting.title}</h3>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground font-bold font-mono">
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Started {new Date(meeting.startTime).toLocaleTimeString()}</span>
                                                        <span className="flex items-center gap-1.5 font-bold text-primary uppercase animate-pulse">● LIVE NOW</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/admin/meetings/${meeting.id}`}>
                                                <Button className="h-10 px-6 rounded-full bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] gap-2">
                                                    Join Room <ArrowRight className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Start Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <QuickCard
                            title="Schedule Call"
                            desc="Integrate with Google/Outlook"
                            icon={Calendar}
                            color="bg-blue-500"
                        />
                        <QuickCard
                            title="Recent History"
                            desc="View past notes & recordings"
                            icon={History}
                            color="bg-purple-500"
                            onClick={() => { }}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Activity Log / Sidebar Info */}
                    <Card className="border-none shadow-xl bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {pastMeetings.slice(0, 5).map(m => (
                                <div key={m.id} className="flex gap-3 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 mt-1.5" />
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase">{m.title}</p>
                                        <p className="text-muted-foreground">{new Date(m.startTime).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                            {pastMeetings.length === 0 && <p className="text-xs text-muted-foreground italic px-4 pb-4">No recent calls to show.</p>}
                        </CardContent>
                    </Card>

                    <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
                        <h4 className="font-black text-primary uppercase text-xs tracking-widest mb-2">Pro Tip</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            You can take persistent notes directly inside the meeting room. These notes are saved to the CRM permanently.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickCard({ title, desc, icon: Icon, color, onClick }: { title: string, desc: string, icon: LucideIcon, color: string, onClick?: () => void }) {
    return (
        <Card className="hover:border-primary/50 transition-all cursor-pointer group shadow-lg border-zinc-100 dark:border-zinc-800" onClick={onClick}>
            <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-black text-sm uppercase tracking-widest">{title}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{desc}</p>
                </div>
            </CardContent>
        </Card>
    );
}
