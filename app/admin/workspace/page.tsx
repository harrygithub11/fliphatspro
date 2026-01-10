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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    CheckCircle2, Clock, Phone, MessageSquare, FileText, User, RefreshCw, Plus,
    MoreHorizontal, Pencil, Trash2, Calendar, AlertCircle, Activity, UserCheck,
    ArrowUpRight, Settings, Circle, ChevronDown, ListTodo, Package, History
} from 'lucide-react';
import Link from 'next/link';
import { KanbanBoard } from '@/components/admin/KanbanBoard';
import TaskListView from '@/components/admin/TaskListView';
import TaskDrawer from '@/components/admin/TaskDrawer';

interface Task {
    id: number;
    title: string;
    description?: string;
    customer_id?: number;
    related_order_id?: number;
    customer_name?: string;
    customer_email?: string;
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
    avatar_url?: string;
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
    const [activityTypeFilter, setActivityTypeFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'clickup'>('clickup');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<number[]>([]);

    // Add Task Dialog
    const [addTaskOpen, setAddTaskOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', due_time: '', priority: 'medium', customer_id: '', assigned_to: '', status: 'open' });
    const [leads, setLeads] = useState<{ id: number; name: string; email: string }[]>([]);

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

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/admin/leads');
            const data = await res.json();
            if (Array.isArray(data)) setLeads(data);
            else if (data.leads && Array.isArray(data.leads)) setLeads(data.leads);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        Promise.all([fetchTasks(), fetchTimeline(), fetchTeam(), fetchLeads()]).finally(() => setLoading(false));
    }, [statusFilter, priorityFilter, userFilter, activityUserFilter]);

    const openCreateTaskDialog = (status?: string) => {
        setNewTask(prev => ({ ...prev, status: status || 'open' }));
        setAddTaskOpen(true);
    };

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
                    status: newTask.status || 'open',
                    priority: newTask.priority,
                    customer_id: newTask.customer_id || null,
                    assigned_to: (newTask.assigned_to && newTask.assigned_to !== 'unassigned') ? newTask.assigned_to : null
                })
            });
            setAddTaskOpen(false);
            setNewTask({ title: '', description: '', due_date: '', due_time: '', priority: 'medium', customer_id: '', assigned_to: '', status: 'open' });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const updateTask = async (taskId: number, updates: Partial<Task>) => {
        // Prepare optimistic updates
        const optimisticUpdates = { ...updates };

        // Special handling for assignment to update the name immediately
        if ('assigned_to' in updates) {
            if (!updates.assigned_to || updates.assigned_to === 'unassigned' as any) {
                optimisticUpdates.assigned_to = undefined;
                optimisticUpdates.assigned_name = undefined;
            } else {
                const member = team.find(m => String(m.id) === String(updates.assigned_to));
                if (member) optimisticUpdates.assigned_name = member.name;
            }
        }

        // Apply optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...optimisticUpdates } : t));

        if (selectedTask?.id === taskId) {
            setSelectedTask(prev => prev ? { ...prev, ...optimisticUpdates } : null);
        }

        // API Call
        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, ...updates })
            });
        } catch (e) {
            console.error('Failed to update task:', e);
            fetchTasks(); // Revert/Refresh on error
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

    // ClickUp-style handlers
    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setDrawerOpen(true);
    };

    const handleQuickAdd = async (status: string, title: string) => {
        try {
            await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, status, priority: 'medium' })
            });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDuplicate = async (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        try {
            await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${task.title} (copy)`,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    due_date: task.due_date,
                    customer_id: task.customer_id,
                    assigned_to: task.assigned_to
                })
            });
            fetchTasks();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSelectTask = (taskId: number, selected: boolean) => {
        setSelectedTasks(prev =>
            selected ? [...prev, taskId] : prev.filter(id => id !== taskId)
        );
    };

    const handleSelectAll = (status: string, selected: boolean) => {
        const statusTasks = tasks.filter(t => t.status === status).map(t => t.id);
        setSelectedTasks(prev =>
            selected
                ? Array.from(new Set([...prev, ...statusTasks]))
                : prev.filter(id => !statusTasks.includes(id))
        );
    };

    const handleAddComment = (taskId: number, body: string) => {
        // Just refresh - the drawer handles the actual API call
        fetchTasks();
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

    const filteredTimeline = timeline.filter(item => {
        if (activityTypeFilter === 'all') return true;
        if (activityTypeFilter === 'notes') return ['note', 'call', 'whatsapp'].some(t => item.action_type.includes(t));
        if (activityTypeFilter === 'system') return !['note', 'call', 'whatsapp'].some(t => item.action_type.includes(t));
        return true;
    });

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
            {/* 
                LAYER 1 - IDENTITY 
                Context: "Where am I? What is the primary action?"
            */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Workspace</h1>
                    <p className="text-muted-foreground mt-1 text-base">Manage your tasks and track team activity.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { fetchTasks(); fetchTimeline(); }}
                        className="h-10 px-4 gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-zinc-600 dark:text-zinc-400"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>

                    <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-10 px-6 gap-2 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10 hover:shadow-zinc-500/20 hover:scale-[1.02] transition-all font-medium">
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
                                    <Label>Related Customer</Label>
                                    <Select value={newTask.customer_id || 'none'} onValueChange={v => setNewTask({ ...newTask, customer_id: v === 'none' ? '' : v })}>
                                        <SelectTrigger><SelectValue placeholder="Select Customer (Optional)" /></SelectTrigger>
                                        <SelectContent style={{ zIndex: 9999, maxHeight: '200px' }}>
                                            <SelectItem value="none">No Customer Linked</SelectItem>
                                            {leads.map(lead => (
                                                <SelectItem key={lead.id} value={String(lead.id)}>{lead.name} ({lead.email})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Priority</Label>
                                        <Select value={newTask.priority} onValueChange={v => setNewTask({ ...newTask, priority: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent style={{ zIndex: 9999 }}>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Assign To</Label>
                                        <Select value={newTask.assigned_to || 'unassigned'} onValueChange={v => setNewTask({ ...newTask, assigned_to: v })}>
                                            <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                                            <SelectContent style={{ zIndex: 9999 }}>
                                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                                {Array.isArray(team) && team.map(member => (
                                                    <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select value={newTask.status || 'open'} onValueChange={v => setNewTask({ ...newTask, status: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent style={{ zIndex: 9999 }}>
                                            <SelectItem value="open">To Do</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="done">Done</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleCreateTask} className="w-full bg-zinc-900 text-white hover:bg-zinc-800">Create Task</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            {/* 
                LAYER 2 - INTELLIGENCE (STATS) 
                Context: "What is happening right now?"
            */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                <Card className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Tasks</p>
                            <p className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-zinc-50">{stats.total}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:scale-110 transition-transform duration-300">
                            <ListTodo className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-orange-50/40 dark:bg-orange-950/10 backdrop-blur-md border border-orange-200/50 dark:border-orange-900/30 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600/80 dark:text-orange-400/80">Due Today</p>
                            <p className="text-2xl lg:text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.dueToday}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-red-50/40 dark:bg-red-950/10 backdrop-blur-md border border-red-200/50 dark:border-red-900/30 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-red-600/80 dark:text-red-400/80">High Priority</p>
                            <p className="text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-400">{stats.highPriority}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-300">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-emerald-50/40 dark:bg-emerald-950/10 backdrop-blur-md border border-emerald-200/50 dark:border-emerald-900/30 shadow-sm hover:shadow-md transition-shadow group">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Completed</p>
                            <p className="text-2xl lg:text-3xl font-bold text-emerald-700 dark:text-emerald-400">{stats.completed}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 
                LAYER 3 - CONTROL (OPERATIONS BAR)
                Context: "How do I want to see the data?"
            */}
            <Tabs defaultValue="tasks" className="w-full space-y-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-0">
                    <TabsList className="bg-transparent h-12 p-0 gap-8">
                        <TabsTrigger
                            value="tasks"
                            className="h-full bg-transparent border-b-2 border-transparent rounded-none px-1 text-sm font-medium text-zinc-500 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 transition-all hover:text-zinc-900 dark:hover:text-zinc-300"
                        >
                            Tasks & Todos
                        </TabsTrigger>
                        <TabsTrigger
                            value="timeline"
                            className="h-full bg-transparent border-b-2 border-transparent rounded-none px-1 text-sm font-medium text-zinc-500 data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-100 data-[state=active]:text-zinc-900 dark:data-[state=active]:text-zinc-100 transition-all hover:text-zinc-900 dark:hover:text-zinc-300"
                        >
                            Global Activity
                        </TabsTrigger>
                    </TabsList>

                    {/* CONTROL CLUSTER: Filters & Views */}
                    <div className="flex items-center gap-3 w-full lg:w-auto pb-3 lg:pb-0 overflow-x-auto no-scrollbar">
                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 w-auto min-w-[110px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-medium rounded-lg shadow-sm">
                                <span className="flex items-center gap-2">
                                    <ListTodo className="w-3.5 h-3.5 text-zinc-500" />
                                    {statusFilter === 'all' ? 'Status' : statusFilter.replace('_', ' ')}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="done">Done</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Priority Filter */}
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="h-9 w-auto min-w-[110px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-medium rounded-lg shadow-sm">
                                <span className="flex items-center gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                                    {priorityFilter === 'all' ? 'Priority' : priorityFilter}
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* User Filter */}
                        <Select value={userFilter} onValueChange={setUserFilter}>
                            <SelectTrigger className="h-9 w-auto min-w-[110px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-medium rounded-lg shadow-sm">
                                <span className="flex items-center gap-2 max-w-[150px]">
                                    <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                    <span className="truncate">
                                        {userFilter === 'all'
                                            ? 'User'
                                            : team.find(member => String(member.id) === userFilter)?.name || 'User'}
                                    </span>
                                </span>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {team.map(member => (
                                    <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1" />

                        {/* View Toggles */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                            <Button
                                variant={viewMode === 'clickup' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${viewMode === 'clickup' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                                onClick={() => setViewMode('clickup')}
                            >
                                <ListTodo className="w-3.5 h-3.5 mr-1.5" /> List
                            </Button>
                            <Button
                                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${viewMode === 'kanban' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                                onClick={() => setViewMode('kanban')}
                            >
                                <Settings className="w-3.5 h-3.5 mr-1.5" /> Board
                            </Button>
                            <Button
                                variant={viewMode === 'list' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
                                onClick={() => setViewMode('list')}
                            >
                                <Activity className="w-3.5 h-3.5 mr-1.5" /> Cards
                            </Button>
                        </div>
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
                            <Button variant="outline" className="mt-6" onClick={() => openCreateTaskDialog('open')}>Create Task</Button>
                        </div>
                    ) : viewMode === 'clickup' ? (
                        <TaskListView
                            tasks={tasks as any}
                            team={team}
                            onStatusChange={(taskId, status) => updateTask(taskId, { status } as any)}
                            onPriorityChange={(taskId, priority) => updateTask(taskId, { priority } as any)}
                            onAssigneeChange={(taskId, userId) => updateTask(taskId, { assigned_to: userId ?? undefined } as any)}
                            onTaskClick={handleTaskClick as any}
                            onQuickAdd={handleQuickAdd}
                            onOpenCreateTask={openCreateTaskDialog}
                            onDelete={handleDeleteTask}
                            onDuplicate={handleDuplicate}
                            selectedTasks={selectedTasks}
                            onSelectTask={handleSelectTask}
                            onSelectAll={handleSelectAll}
                        />
                    ) : viewMode === 'kanban' ? (
                        <KanbanBoard
                            tasks={tasks as any}
                            onStatusChange={(taskId, newStatus) => updateTask(taskId, { status: newStatus } as any)}
                            onTaskClick={(task) => { setEditingTask(task); setEditTaskOpen(true); }}
                        />
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
                                        <Select value={task.status} onValueChange={v => updateTask(task.id, { status: v })}>
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
                                            <TooltipProvider delayDuration={300}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="mt-2 flex justify-center cursor-help opacity-50 hover:opacity-100 transition-opacity">
                                                            <History className="w-3.5 h-3.5 text-muted-foreground" />
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="text-xs max-w-[200px]">
                                                        <p className="font-semibold mb-1">Status History</p>
                                                        <p>Updated by <span className="text-primary">{task.status_changed_by_name}</span></p>
                                                        <p className="text-muted-foreground">{task.status_changed_at ? new Date(task.status_changed_at).toLocaleString() : ''}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
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
                                                <Link href={`/admin/leads/${task.customer_id}`} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline transition-colors cursor-pointer font-medium">
                                                    <User className="w-3.5 h-3.5" />
                                                    {task.customer_name}
                                                </Link>
                                            )}

                                            {task.related_order_id && (
                                                <Link href={`/admin/orders/${task.related_order_id}`} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30">
                                                    <Package className="w-3.5 h-3.5" />
                                                    Order #{task.related_order_id}
                                                </Link>
                                            )}

                                            <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400" title={new Date(task.created_at).toLocaleString()}>
                                                <Clock className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">{new Date(task.created_at).toLocaleDateString()}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                                Created by {task.created_by_name}
                                            </div>

                                            <Select
                                                value={task.assigned_to ? String(task.assigned_to) : "unassigned"}
                                                onValueChange={v => updateTask(task.id, { assigned_to: v === 'unassigned' ? undefined : Number(v) } as any)}
                                            >
                                                <SelectTrigger className="ml-auto w-auto h-auto border-none shadow-none p-0 [&>svg]:hidden focus:ring-0">
                                                    {task.assigned_to ? (() => {
                                                        const assignedMember = team.find(m => m.id === task.assigned_to);
                                                        const firstName = task.assigned_name?.split(' ')[0] || task.assigned_name || 'Unknown';
                                                        return (
                                                            <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700 hover:border-primary/50 transition-all cursor-pointer">
                                                                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold overflow-hidden">
                                                                    {assignedMember?.avatar_url ? (
                                                                        <img src={assignedMember.avatar_url} alt={firstName} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        firstName.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-medium text-foreground">{firstName}</span>
                                                            </div>
                                                        );
                                                    })() : (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide border border-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-all cursor-pointer">
                                                            Unassigned
                                                        </div>
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent align="end">
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {team.map(member => (
                                                        <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
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
                        </div>
                        <div className="flex gap-2">
                            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                                <SelectTrigger className="w-[130px] bg-white dark:bg-zinc-900 h-9 text-xs">
                                    <SelectValue placeholder="All Activity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Activity</SelectItem>
                                    <SelectItem value="notes">Notes & Calls</SelectItem>
                                    <SelectItem value="system">System Updates</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={activityUserFilter} onValueChange={setActivityUserFilter}>
                                <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-900 h-9 text-xs">
                                    <SelectValue placeholder="All Users" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Users</SelectItem>
                                    {team.map(member => (
                                        <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pl-4">
                        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 before:to-transparent dark:before:via-zinc-800">
                            {filteredTimeline.length === 0 ? (
                                <div className="text-center py-10 pl-8 text-muted-foreground">No activity history found.</div>
                            ) : (
                                filteredTimeline.map((item, index) => {
                                    const isSystem = !['note', 'call', 'whatsapp'].some(t => item.action_type.includes(t));
                                    const isNote = item.action_type.includes('note');
                                    const isCall = item.action_type.includes('call');

                                    return (
                                        <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            {/* Icon Bubble */}
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-zinc-950 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${isNote ? 'bg-amber-100 text-amber-600' :
                                                isCall ? 'bg-blue-100 text-blue-600' :
                                                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                                }`}>
                                                {getActionIcon(item.action_type)}
                                            </div>

                                            {/* Content Card */}
                                            <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow ${isNote ? 'bg-amber-50/60 border-amber-200/60 dark:bg-amber-900/10' :
                                                isCall ? 'bg-blue-50/60 border-blue-200/60 dark:bg-blue-900/10' :
                                                    'bg-white/60 dark:bg-zinc-900/60 border-zinc-200/50 dark:border-zinc-800/50'
                                                }`}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{item.admin_name}</span>
                                                        <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium ${isNote ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                            isCall ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                'bg-zinc-100 text-zinc-500 border-zinc-200'
                                                            }`}>
                                                            {isNote ? 'NOTE' : isCall ? 'CALL' : 'SYSTEM'}
                                                        </Badge>
                                                    </div>
                                                    <time className="font-mono text-[10px] text-zinc-400">{new Date(item.created_at).toLocaleString()}</time>
                                                </div>
                                                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {item.description}
                                                    {item.customer_name && (
                                                        <Link href={`/admin/leads/${item.customer_id}`} className="block mt-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 hover:underline px-2 py-1 rounded w-fit transition-all font-medium border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-300">
                                                            Target: {item.customer_name}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

            {/* Task Detail Drawer */ }
    <TaskDrawer
        task={selectedTask as any}
        isOpen={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedTask(null); }}
        team={team}
        customers={leads}
        onUpdate={(taskId, updates) => updateTask(taskId, updates as Partial<Task>)}
        onAddComment={handleAddComment}
    />
        </div >
    );
}
