'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, Phone, MessageSquare, FileText, User, Filter, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Task {
    id: number;
    title: string;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    due_date: string | null;
    status: string;
    priority: string;
    created_at: string;
}

interface Interaction {
    id: number;
    customer_id: number;
    customer_name: string;
    type: string;
    content: string;
    created_at: string;
    created_by_name?: string;
}

export default function WorkspacePage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [timeline, setTimeline] = useState<Interaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');

    const fetchTasks = async () => {
        let url = '/api/admin/tasks?';
        if (statusFilter !== 'all') url += `status=${statusFilter}&`;
        if (priorityFilter !== 'all') url += `priority=${priorityFilter}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data.success) setTasks(data.tasks);
    };

    const fetchTimeline = async () => {
        const res = await fetch('/api/admin/interactions?limit=50');
        const data = await res.json();
        if (data.success) setTimeline(data.interactions);
    };

    useEffect(() => {
        Promise.all([fetchTasks(), fetchTimeline()]).finally(() => setLoading(false));
    }, [statusFilter, priorityFilter]);

    const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'done' ? 'open' : 'done';

        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: taskId, status: newStatus })
            });
        } catch (e) {
            // Revert on error
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: currentStatus } : t));
        }
    };

    const getTimelineIcon = (type: string) => {
        switch (type) {
            case 'call_log': return <Phone className="w-4 h-4" />;
            case 'whatsapp_msg': return <MessageSquare className="w-4 h-4" />;
            case 'system_event': return <FileText className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getTimelineColor = (type: string) => {
        switch (type) {
            case 'call_log': return 'bg-blue-100 text-blue-600';
            case 'whatsapp_msg': return 'bg-green-100 text-green-600';
            case 'system_event': return 'bg-zinc-100 text-zinc-600';
            default: return 'bg-purple-100 text-purple-600';
        }
    };

    if (loading) return <div className="p-10 text-center">Loading Workspace...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Workspace</h1>
                    <p className="text-muted-foreground">All tasks and activities across your CRM</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchTasks(); fetchTimeline(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline ({timeline.length})</TabsTrigger>
                </TabsList>

                {/* TASKS TAB */}
                <TabsContent value="tasks" className="mt-6">
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">All Tasks</CardTitle>
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
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No tasks found.</p>
                            ) : (
                                <div className="space-y-2">
                                    {tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                                            <button
                                                onClick={() => toggleTaskStatus(task.id, task.status)}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${task.status === 'done'
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-zinc-300 hover:border-zinc-400'
                                                    }`}
                                            >
                                                {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <p className={`font-medium text-sm ${task.status === 'done' && 'line-through text-muted-foreground'}`}>
                                                    {task.title}
                                                </p>
                                                <Link href={`/admin/leads/${task.customer_id}`} className="text-xs text-muted-foreground hover:underline">
                                                    {task.customer_name || 'Unknown Customer'}
                                                </Link>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge variant="outline" className={`text-[10px] ${task.priority === 'high' ? 'text-red-500 border-red-200 bg-red-50' :
                                                        task.priority === 'medium' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                                                            'text-zinc-500'
                                                    }`}>
                                                    {task.priority}
                                                </Badge>

                                                {task.due_date && (
                                                    <div className={`flex items-center gap-1 text-xs ${task.status !== 'done' && new Date(task.due_date) < new Date()
                                                            ? 'text-red-500 font-medium'
                                                            : 'text-muted-foreground'
                                                        }`}>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </div>
                                                )}
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
                        </CardHeader>
                        <CardContent>
                            {timeline.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No activity yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {timeline.map((item, i) => (
                                        <div key={item.id} className="flex gap-4 relative">
                                            {/* Connector Line */}
                                            {i !== timeline.length - 1 && (
                                                <div className="absolute left-4 top-10 bottom-[-16px] w-px bg-zinc-200 dark:bg-zinc-800"></div>
                                            )}

                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${getTimelineColor(item.type)}`}>
                                                {getTimelineIcon(item.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Link href={`/admin/leads/${item.customer_id}`} className="text-sm font-semibold hover:underline">
                                                        {item.customer_name || 'Unknown'}
                                                    </Link>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(item.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm bg-zinc-50 dark:bg-zinc-900 border p-3 rounded-lg">
                                                    {item.content}
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
