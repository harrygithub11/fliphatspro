'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    CheckCircle2, Clock, Phone, MessageSquare, FileText, User, RefreshCw, Plus,
    MoreHorizontal, Pencil, Trash2, Calendar, AlertCircle, Activity, UserCheck,
    ArrowUpRight, Settings
} from 'lucide-react';
import Link from 'next/link';

interface Task {
    id: number;
    title: string;
    description?: string;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    assigned_to?: number;
    assigned_name?: string;
    due_date: string | null;
    status: string;
    priority: string;
    created_at: string;
    created_by_name?: string;
    assigned_to?: number;
    assigned_name?: string;
}

interface TimelineItem {
    id: number;
    source: string;
    action_type: string;
    description: string;
    customer_id: number | null;
    customer_name: string | null;
    admin_id: number | null;
    admin_name: string | null;
    created_at: string;
}

interface TeamMember {
    id: number;
    name: string;
    email: string;
}

export default function WorkspacePage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [userFilter, setUserFilter] = useState('all');

    // Add Task Dialog
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', due_time: '', priority: 'medium', customer_id: '', assigned_to: '' });

    // Edit Task Dialog
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const fetchTasks = async () => {
        let url = '/api/admin/tasks?';
        if (statusFilter !== 'all') url += `status=${statusFilter}&`;
        if (priorityFilter !== 'all') url += `priority=${priorityFilter}&`;
        if (userFilter !== 'all') url += `created_by=${userFilter}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setTasks(data.tasks);
    };

    const fetchTimeline = async () => {
        const res = await fetch('/api/admin/interactions?limit=100');
        const data = await res.json();
        if (data.success) setTimeline(data.interactions);
    };

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (data.success) setTeam(data.members || []);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        Promise.all([fetchTasks(), fetchTimeline(), fetchTeam()]).finally(() => setLoading(false));
    }, [statusFilter, priorityFilter, userFilter]);

    const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'open' : 'done';
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: newStatus })
            });
        } catch (e) {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
        }
    };

    const handleCreateTask = async () => {
        if (!newTask.title) return;

        let finalDate = newTask.due_date;
        if (newTask.due_date && newTask.due_time) {
            finalDate = `${newTask.due_date} ${newTask.due_time}:00`;
        }

        try {
            await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTask.title,
                    description: newTask.description,
                    due_date: finalDate || null,
                    priority: newTask.priority,
                    customer_id: newTask.customer_id || null,
                    assigned_to: newTask.assigned_to || null
                })
            });
            setAddTaskOpen(false);
            setNewTask({ title: '', description: '', due_date: '', due_time: '', priority: 'medium', customer_id: '', assigned_to: '' });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdateTask = async (taskId: number, field: string, value: string) => {
        const oldTasks = [...tasks];
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, [field]: value })
            });
        } catch (e) {
            setTasks(oldTasks);
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await fetch(`/api/admin/tasks?id=${taskId}`, { method: 'DELETE' });
        } catch (e) {
            fetchTasks(); // Refetch on error
        }
    };

    const getActionIcon = (type: string) => {
        if (type?.includes('call')) return <Phone className="w-4 h-4" />;
        if (type?.includes('whatsapp')) return <MessageSquare className="w-4 h-4" />;
        if (type?.includes('task')) return <CheckCircle2 className="w-4 h-4" />;
        if (type?.includes('lead') || type?.includes('customer')) return <User className="w-4 h-4" />;
        if (type?.includes('login')) return <UserCheck className="w-4 h-4" />;
        return <Activity className="w-4 h-4" />;
    };

    const getActionColor = (type: string) => {
        if (type?.includes('call')) return 'bg-blue-100 text-blue-600';
        if (type?.includes('whatsapp')) return 'bg-green-100 text-green-600';
        if (type?.includes('task')) return 'bg-purple-100 text-purple-600';
        if (type?.includes('lead') || type?.includes('created')) return 'bg-emerald-100 text-emerald-600';
        if (type?.includes('login')) return 'bg-orange-100 text-orange-600';
        return 'bg-zinc-100 text-zinc-600';
    };

    if (loading) return <div className="p-10 text-center">Loading Workspace...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Workspace</h1>
                    <p className="text-muted-foreground">All tasks and activities across your CRM</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Task</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Create New Task</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Task Title *</Label>
                                    <Input
                                        placeholder="Follow up with client..."
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Additional details..."
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Due Date</Label>
                                        <Input type="date" value={newTask.due_date} onChange={e => setNewTask({ ...newTask, due_date: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Time</Label>
                                        <Input type="time" value={newTask.due_time} onChange={e => setNewTask({ ...newTask, due_time: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Priority</Label>
                                    <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            <SelectItem value="high"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>High</SelectItem>
                                            <SelectItem value="medium"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Medium</SelectItem>
                                            <SelectItem value="low"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Assign To</Label>
                                    <Select value={newTask.assigned_to} onValueChange={v => setNewTask({ ...newTask, assigned_to: v })}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent className="z-[9999]">
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {team.map(member => (
                                                <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={() => { fetchTasks(); fetchTimeline(); }}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="tasks" className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Tasks ({tasks.length})</TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-2"><Activity className="w-4 h-4" /> Activity ({timeline.length})</TabsTrigger>
                </TabsList>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="mt-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">All Tasks</CardTitle>
                                    <CardDescription>Manage tasks across all leads</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Status</SelectItem>
                                            <SelectItem value="open">Open</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Priority</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={userFilter} onValueChange={setUserFilter}>
                                        <SelectTrigger className="w-[120px] h-8">
                                            <SelectValue placeholder="User" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Users</SelectItem>
                                            {team.map(member => (
                                                <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">No tasks found.</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={() => setAddTaskOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" /> Create First Task
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <div key={task.id} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors group">
                                            <Select value={task.status} onValueChange={v => handleUpdateTask(task.id, 'status', v)}>
                                                <SelectTrigger className="w-auto h-auto p-0 border-none shadow-none mt-1">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer ${task.status === 'done'
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : task.status === 'in_progress'
                                                            ? 'bg-blue-100 border-blue-300 text-blue-600'
                                                            : 'border-zinc-300 hover:border-primary hover:bg-primary/10'
                                                        }`}>
                                                        {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                                        {task.status === 'in_progress' && <div className="w-2 h-2 bg-current rounded-full" />}
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="done">Done</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className={`font-medium text-sm ${task.status === 'done' && 'line-through text-muted-foreground'}`}>
                                                            {task.title}
                                                        </p>
                                                        {task.description && (
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
                                                        )}
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleUpdateTask(task.id, 'status', 'in_progress')}>
                                                                <Clock className="w-4 h-4 mr-2" /> Mark In Progress
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleUpdateTask(task.id, 'priority', 'high')}>
                                                                <AlertCircle className="w-4 h-4 mr-2" /> Set High Priority
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteTask(task.id)}>
                                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Task
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                                    {task.customer_name && (
                                                        <Link href={`/admin/leads/${task.customer_id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                                            <User className="w-3 h-3" /> {task.customer_name}
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        </Link>
                                                    )}

                                                    <Select value={task.priority} onValueChange={v => handleUpdateTask(task.id, 'priority', v)}>
                                                        <SelectTrigger className="h-6 w-auto border-none shadow-none p-0 text-xs">
                                                            <Badge variant="outline" className={`text-[10px] cursor-pointer ${task.priority === 'high' ? 'text-red-500 border-red-200 bg-red-50' :
                                                                task.priority === 'medium' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                                                    'text-green-600 border-green-200 bg-green-50'
                                                                }`}>
                                                                {task.priority}
                                                            </Badge>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="high">🔴 High</SelectItem>
                                                            <SelectItem value="medium">🟡 Medium</SelectItem>
                                                            <SelectItem value="low">🟢 Low</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    {task.due_date && (
                                                        <div className={`flex items-center gap-1 text-xs ${task.status !== 'done' && new Date(task.due_date) < new Date()
                                                            ? 'text-red-500 font-medium'
                                                            : 'text-muted-foreground'
                                                            }`}>
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.due_date).toLocaleDateString()} {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className="text-xs text-muted-foreground font-medium">
                                                            {task.created_by_name && `Created by ${task.created_by_name}`} &bull; {new Date(task.created_at).toLocaleDateString()}
                                                        </span>
                                                        {task.assigned_name && (
                                                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-400">
                                                                Assigned to {task.assigned_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TIMELINE TAB */}
                <TabsContent value="timeline" className="mt-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Global Activity Feed</CardTitle>
                            <CardDescription>Everything happening across your CRM</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <div className="text-center py-12">
                                    <Activity className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                                    <p className="text-muted-foreground">No activity recorded yet.</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">Activities will appear here as you use the CRM</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {timeline.map((item, i) => (
                                        <div key={`${item.source}-${item.id}`} className="flex gap-4 relative">
                                            {i !== timeline.length - 1 && (
                                                <div className="absolute left-4 top-10 bottom-[-16px] w-px bg-zinc-200 dark:bg-zinc-800"></div>
                                            )}

                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getActionColor(item.action_type)}`}>
                                                {getActionIcon(item.action_type)}
                                            </div>

                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold">{item.admin_name || 'System'}</span>
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{item.action_type?.replace(/_/g, ' ')}</Badge>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm bg-zinc-50 dark:bg-zinc-900 border p-3 rounded-lg">
                                                    {item.description}
                                                    {item.customer_name && (
                                                        <Link href={`/admin/leads/${item.customer_id}`} className="block mt-2 text-xs text-primary hover:underline">
                                                            → {item.customer_name}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
