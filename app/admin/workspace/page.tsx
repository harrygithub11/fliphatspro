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
    ArrowUpRight, Settings, Circle, ChevronDown, ListTodo
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
    status_changed_by?: number;
    status_changed_by_name?: string;
    status_changed_at?: string;
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
    const [activityUserFilter, setActivityUserFilter] = useState('all');

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
        let url = '/api/admin/interactions?limit=100';
        if (activityUserFilter !== 'all') url += `&admin_id=${activityUserFilter}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setTimeline(data.interactions);
    };

    const fetchTeam = async () => {
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (Array.isArray(data)) setTeam(data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        Promise.all([fetchTasks(), fetchTimeline(), fetchTeam()]).finally(() => setLoading(false));
    }, [statusFilter, priorityFilter, userFilter, activityUserFilter]);

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

    // Calculate quick stats for the top bar
    const stats = {
        total: tasks.length,
        dueToday: tasks.filter(t => {
            if (!t.due_date) return false;
            const today = new Date().toISOString().split('T')[0];
            return t.due_date.startsWith(today);
        }).length,
        highPriority: tasks.filter(t => t.priority === 'high').length,
        completed: tasks.filter(t => t.status === 'done').length
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground animate-pulse">Loading your workspace...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">Workspace</h1>
                    <p className="text-muted-foreground mt-1">Manage your tasks and track team activity.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { fetchTasks(); fetchTimeline(); }} className="gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                <Plus className="w-4 h-4" /> New Task
                            </Button>
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
                                        className="bg-zinc-50/50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="Additional details..."
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        className="bg-zinc-50/50 min-h-[100px]"
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
                                        <SelectContent style={{ zIndex: 9999 }}>
                                            <SelectItem value="high"><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2"></span>High</SelectItem>
                                            <SelectItem value="medium"><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>Medium</SelectItem>
                                            <SelectItem value="low"><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Assign To</Label>
                                    <Select value={newTask.assigned_to || ''} onValueChange={v => setNewTask({ ...newTask, assigned_to: v })}>
                                        <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                        <SelectContent style={{ zIndex: 9999 }}>
                                            <SelectItem value="">Unassigned</SelectItem>
                                            {Array.isArray(team) && team.map(member => (
                                                <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleCreateTask} className="w-full">Create Task</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                            <p className="text-2xl font-bold">{stats.total}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600">
                            <ListTodo className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Due Today</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.dueToday}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                            <p className="text-2xl font-bold text-red-600">{stats.highPriority}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-950/30 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-1 mb-6">
                    <TabsList className="bg-transparent h-auto p-0 gap-6">
                        <TabsTrigger
                            value="tasks"
                            className="bg-transparent border-0 rounded-none shadow-none p-0 pb-3 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all rounded-t-sm px-2 text-base"
                        >
                            Tasks & Todos
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="bg-transparent border-0 rounded-none shadow-none p-0 pb-3 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground transition-all rounded-t-sm px-2 text-base"
                        >
                            Global Activity
                        </TabsTrigger>
                    </TabsList>

                    {/* Filters Toolbar - Only visible for tasks tab but kept in flex for alignment */}
                    <div className="flex items-center gap-2">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent min-w-[100px] text-xs font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <ListTodo className="w-3 h-3" />
                                    <span className="text-foreground">{statusFilter === 'all' ? 'Status' : statusFilter}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="h-8 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent min-w-[100px] text-xs font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <AlertCircle className="w-3 h-3" />
                                    <span className="text-foreground">{priorityFilter === 'all' ? 'Priority' : priorityFilter}</span>
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger className="h-8 border-dashed border-zinc-300 dark:border-zinc-700 bg-transparent min-w-[100px] text-xs font-medium">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <User className="w-3 h-3" />
                                    <span className="text-foreground">{userFilter === 'all' ? 'User' : 'Selected User'}</span>
                                </div>
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

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="mt-0 space-y-4">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                <ListTodo className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No tasks found</h3>
                            <p className="text-zinc-500 text-sm max-w-sm text-center mt-2">
                                You're all caught up! Create a new task to get started or adjust your filters.
                            </p>
                            <Button variant="outline" className="mt-6" onClick={() => setAddTaskOpen(true)}>Create Task</Button>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    className="group relative flex flex-col sm:flex-row gap-4 p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white hover:bg-zinc-50/80 dark:bg-zinc-900 dark:hover:bg-zinc-900/80 transition-all hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700"
                                >
                                    {/* Priority Line Indicator */}
                                    <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${task.priority === 'high' ? 'bg-red-500' :
                                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                        }`} />

                                    {/* Checkbox / Status */}
                                    <div className="pl-3 flex flex-col justify-start pt-1">
                                        <Select value={task.status} onValueChange={v => handleUpdateTask(task.id, 'status', v)}>
                                            <SelectTrigger className="w-auto h-auto border-none shadow-none p-0 [&>svg]:hidden focus:ring-0">
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' :
                                                        'border-zinc-300 dark:border-zinc-600 hover:border-primary'
                                                        }`}>
                                                        {task.status === 'done' && <CheckCircle2 className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent align="start">
                                                <SelectItem value="open">Open</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="done">Done</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {task.status_changed_by_name && (
                                            <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap hidden sm:block">
                                                By {task.status_changed_by_name?.split(' ')[0]}
                                            </span>
                                        )}
                                    </div>

                                    {/* Main Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={`font-medium text-base text-zinc-900 dark:text-zinc-100 line-clamp-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                                    {task.title}
                                                </h3>
                                                {task.description && (
                                                    <p className="text-sm text-zinc-500 mt-1 line-clamp-2 md:line-clamp-1">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actions visible on hover (desktop) or always (mobile) */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => { setEditingTask(task); setEditTaskOpen(true); }} className="gap-2">
                                                        <Pencil className="w-4 h-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600 gap-2 focus:text-red-600 focus:bg-red-50">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Meta/Footer */}
                                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-3 text-xs text-muted-foreground">
                                            {task.due_date && (
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${new Date(task.due_date) < new Date() && task.status !== 'done'
                                                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                                                    : 'bg-zinc-50 text-zinc-600 border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700'
                                                    }`}>
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}

                                            {task.customer_name && (
                                                <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer">
                                                    <User className="w-3.5 h-3.5" />
                                                    {task.customer_name}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                                Created by {task.created_by_name}
                                            </div>

                                            {task.assigned_name ? (
                                                <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-medium uppercase tracking-wide dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30">
                                                    Assigned to {task.assigned_name}
                                                </div>
                                            ) : (
                                                <div className="ml-auto text-zinc-400 italic">Unassigned</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* TIMELINE TAB */}
                <TabsContent value="timeline" className="mt-0">
                    <Card className="border-none shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-semibold">Activity Stream</CardTitle>
                                <CardDescription>Real-time log of team interactions and updates</CardDescription>
                            </div>
                            <Select value={activityUserFilter} onValueChange={setActivityUserFilter}>
                                <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-900">
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {team.map(member => (
                                        <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardHeader>
                        <CardContent className="px-0 pl-4">
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent dark:before:via-zinc-800">
                                {timeline.length === 0 ? (
                                    <div className="text-center py-10 pl-8 text-muted-foreground">No activity history found.</div>
                                ) : (
                                    timeline.map((item, index) => (
                                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon Bubble */}
                                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                {getActionIcon(item.action_type)}
                                            </div>

                                            {/* Content Card */}
                                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{item.admin_name}</span>
                                                    <time className="font-mono text-[10px] text-zinc-400">{new Date(item.created_at).toLocaleString()}</time>
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {item.description}
                                                    {item.customer_name && (
                                                        <span className="block mt-1 text-xs text-primary font-medium bg-primary/5 px-2 py-1 rounded w-fit">
                                                            Target: {item.customer_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
