'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Calendar, User, Flag, MessageSquare, Clock,
    Activity, Send, ChevronRight, Save, Loader2, AlertCircle
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SearchableCustomerSelect } from '@/components/admin/SearchableCustomerSelect';

interface Task {
    id: number;
    title: string;
    description?: string;
    status: 'open' | 'in_progress' | 'done';
    priority: 'high' | 'medium' | 'low';
    due_date?: string;
    assigned_to?: number;
    assigned_name?: string;
    customer_id?: number;
    customer_name?: string;
    created_at: string;
    created_by_name?: string;
    last_seen_at?: string;
}

interface Comment {
    id: number;
    body: string;
    author_id: number;
    author_name: string;
    created_at: string;
}

interface HistoryItem {
    id: number;
    change_type: string;
    field_name?: string;
    old_value?: string;
    new_value?: string;
    changed_by_name?: string;
    created_at: string;
}



interface TeamMember {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    email: string;
}

interface TaskDrawerProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    team: TeamMember[];
    customers: Customer[];
    onUpdate: (taskId: number, updates: Partial<Task>) => void; // Used to update parent list state
    onAddComment: (taskId: number, body: string) => void;
}

const STATUS_CONFIG = {
    done: { label: 'Complete', color: 'bg-green-500', textColor: 'text-green-500' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500', textColor: 'text-blue-500' },
    open: { label: 'To Do', color: 'bg-gray-500', textColor: 'text-gray-500' },
};

const PRIORITY_CONFIG = {
    high: { label: 'Urgent', color: 'text-red-500' },
    medium: { label: 'Normal', color: 'text-amber-500' },
    low: { label: 'Low', color: 'text-gray-400' },
};

export default function TaskDrawer({
    task,
    isOpen,
    onClose,
    team,
    customers,
    onUpdate,
}: TaskDrawerProps) {
    const { toast } = useToast();
    // Separate State for "Active" (Editable) and "Original" (For dirty check)
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [originalTask, setOriginalTask] = useState<Task | null>(null);

    // Auxiliary Data
    const [comments, setComments] = useState<Comment[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState('details'); // 'details' (implicit), 'comments', 'activity'

    // Fetch Full Details on Open
    useEffect(() => {
        if (task && isOpen) {
            setLoading(true);
            // Initialize with props first for immediate render
            setActiveTask(JSON.parse(JSON.stringify(task)));
            setOriginalTask(JSON.parse(JSON.stringify(task)));
            setIsDirty(false);
            setNewComment('');

            // Mark as read immediately
            fetch(`/api/admin/tasks/${task.id}/read`, { method: 'POST' }).catch(console.error);

            fetch(`/api/admin/tasks/${task.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const fullTask = data.task;
                        // Ensure date format consistency if needed
                        setActiveTask(prev => prev ? { ...prev, ...fullTask } : fullTask);
                        setOriginalTask(fullTask); // Update original to full version
                        setComments(data.task.comments || []);
                        setHistory(data.task.history || []);
                    }
                })
                .catch(err => console.error("Failed to fetch task details", err))
                .finally(() => setLoading(false));
        }
    }, [task?.id, isOpen]);

    // Track Dirty State
    useEffect(() => {
        if (!activeTask || !originalTask) return;

        // Simple comparison of editable fields
        const isChanged =
            activeTask.title !== originalTask.title ||
            activeTask.description !== originalTask.description ||
            activeTask.status !== originalTask.status ||
            activeTask.priority !== originalTask.priority ||
            activeTask.assigned_to !== originalTask.assigned_to ||
            activeTask.customer_id !== originalTask.customer_id ||
            activeTask.due_date !== originalTask.due_date; // Note: Date string format matching is crucial here

        setIsDirty(isChanged);
    }, [activeTask, originalTask]);

    const handleFieldChange = (field: keyof Task, value: any) => {
        if (!activeTask) return;
        setActiveTask(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const handleSave = async () => {
        if (!activeTask || !isDirty) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/tasks/${activeTask.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: activeTask.title,
                    description: activeTask.description,
                    status: activeTask.status,
                    priority: activeTask.priority,
                    assigned_to: activeTask.assigned_to,
                    customer_id: activeTask.customer_id,
                    due_date: activeTask.due_date
                }),
            });
            const data = await res.json();

            if (data.success) {
                toast({ description: "Task updated successfully", className: "bg-green-500 text-white" });
                setOriginalTask(JSON.parse(JSON.stringify(activeTask)));
                setIsDirty(false);
                onUpdate(activeTask.id, activeTask); // Notify parent list

                // Refresh history to show the update action
                fetchHistory(activeTask.id);
            } else {
                toast({ description: "Failed to save changes", variant: "destructive" });
            }
        } catch (e) {
            console.error(e);
            toast({ description: "An error occurred while saving", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleAddComment = async () => {
        if (!activeTask || !newComment.trim()) return;

        // Optimistic UI
        const tempId = Date.now();
        const optimisticComment: Comment = {
            id: tempId,
            body: newComment,
            author_id: 0, // Placeholder
            author_name: 'You',
            created_at: new Date().toISOString()
        };
        setComments(prev => [...prev, optimisticComment]);
        setNewComment('');

        try {
            const res = await fetch(`/api/admin/tasks/${activeTask.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: optimisticComment.body }),
            });
            const data = await res.json();

            if (data.success) {
                // Fetch real comments to sync IDs/Authors
                fetchComments(activeTask.id);
            } else {
                toast({ description: "Failed to post comment", variant: "destructive" });
                setComments(prev => prev.filter(c => c.id !== tempId)); // Revert
            }
        } catch (e) {
            console.error(e);
            toast({ description: "Failed to send comment", variant: "destructive" });
            setComments(prev => prev.filter(c => c.id !== tempId));
        }
    };

    const fetchHistory = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/tasks/${id}`);
            const data = await res.json();
            if (data.success && data.task.history) {
                setHistory(data.task.history);
            }
        } catch (e) { console.error(e); }
    };

    const fetchComments = async (id: number) => {
        try {
            const res = await fetch(`/api/admin/tasks/${id}/comments`);
            const data = await res.json();
            if (data.success) setComments(data.comments);
        } catch (e) { console.error(e); }
    };

    const handleClose = () => {
        if (isDirty) {
            if (confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatActivityMessage = (item: HistoryItem) => {
        switch (item.change_type) {
            case 'status_change': return `changed status from "${item.old_value}" to "${item.new_value}"`;
            case 'priority_change': return `changed priority from "${item.old_value}" to "${item.new_value}"`;
            case 'assigned': return `assigned to ${item.new_value || 'someone'}`;
            case 'field_change': return `updated ${item.field_name}`;
            case 'comment_added': return 'added a comment';
            case 'created': return 'created this task';
            default: return `updated task`;
        }
    };

    if (!activeTask) return null;

    const statusConfig = STATUS_CONFIG[activeTask.status] || STATUS_CONFIG.open;
    const priorityConfig = PRIORITY_CONFIG[activeTask.priority] || PRIORITY_CONFIG.medium;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl">

                {/* Header */}
                <SheetHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-950 z-10">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                            {/* Title Input */}
                            <input
                                value={activeTask.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-xl font-semibold placeholder:text-zinc-400 focus:ring-0 focus:outline-none text-zinc-900 dark:text-zinc-50"
                                placeholder="Task Title"
                            />

                            {/* Status/Priority Badges (Visual only in header, edited below) */}
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className={`${priorityConfig.color} bg-transparent border border-current`}>
                                    <Flag className="w-3 h-3 mr-1" /> {priorityConfig.label}
                                </Badge>
                                <Badge variant="secondary" className={`${statusConfig.textColor} bg-transparent border border-current`}>
                                    {statusConfig.label}
                                </Badge>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleClose} className="-mr-2">
                            <X className="w-5 h-5 text-zinc-500" />
                        </Button>
                    </div>
                </SheetHeader>

                {/* Main Content Scrollable Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">

                        {/* ZONE 1: Data Fields */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Assignee
                                </label>
                                <Select
                                    value={activeTask.assigned_to?.toString() || 'unassigned'}
                                    onValueChange={(val) => handleFieldChange('assigned_to', val === 'unassigned' ? null : parseInt(val))}
                                >
                                    <SelectTrigger className="h-9 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                        <SelectValue placeholder="Unassigned" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                        {team.map(m => (
                                            <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" /> Customer
                                </label>
                                <SearchableCustomerSelect
                                    customers={customers}
                                    value={activeTask.customer_id || null}
                                    onChange={(customerId) => handleFieldChange('customer_id', customerId)}
                                    placeholder="No Customer"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" /> Due Date
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={activeTask.due_date ? new Date(activeTask.due_date).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => handleFieldChange('due_date', e.target.value)} // value is YYYY-MM-DDTHH:mm
                                    className="h-9 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Flag className="w-3.5 h-3.5" /> Priority
                                </label>
                                <Select
                                    value={activeTask.priority}
                                    onValueChange={(val) => handleFieldChange('priority', val)}
                                >
                                    <SelectTrigger className="h-9 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">Urgent</SelectItem>
                                        <SelectItem value="medium">Normal</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> Status
                                </label>
                                <Select
                                    value={activeTask.status}
                                    onValueChange={(val) => handleFieldChange('status', val)}
                                >
                                    <SelectTrigger className="h-9 w-full bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">To Do</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="done">Complete</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                            <Textarea
                                placeholder="Add a description..."
                                value={activeTask.description || ''}
                                onChange={(e) => handleFieldChange('description', e.target.value)}
                                className="min-h-[120px] resize-none bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 transition-colors"
                            />
                        </div>


                        {/* ZONE 2 & 3: Comments and Activity */}
                        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <Tabs defaultValue="comments" className="w-full" onValueChange={setActiveTab}>
                                <TabsList className="w-full grid grid-cols-2 h-9 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                                    <TabsTrigger value="comments" className="text-xs h-7">
                                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Comments ({comments.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="activity" className="text-xs h-7">
                                        <Activity className="w-3.5 h-3.5 mr-1.5" /> Activity
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="comments" className="mt-4 space-y-4">
                                    {/* Input */}
                                    <div className="flex gap-3">
                                        <Avatar className="w-8 h-8 mt-1">
                                            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">Me</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 relative">
                                            <Input
                                                placeholder="Write a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                                className="pr-10 bg-white dark:bg-zinc-950"
                                            />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="absolute right-1 top-1 h-7 w-7 text-primary hover:bg-primary/10"
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* List */}
                                    <div className="space-y-4 pl-11">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-6">
                                                <p className="text-sm text-zinc-400">No comments yet</p>
                                            </div>
                                        ) : (
                                            comments.map((comment: any, index: number) => {
                                                const isNew = activeTask.last_seen_at && new Date(comment.created_at) > new Date(activeTask.last_seen_at);
                                                const prevComment = index > 0 ? comments[index - 1] : null;
                                                const prevIsNew = prevComment && activeTask.last_seen_at && new Date(prevComment.created_at) > new Date(activeTask.last_seen_at);
                                                const showDivider = isNew && !prevIsNew;

                                                return (
                                                    <div key={comment.id}>
                                                        {showDivider && (
                                                            <div className="relative py-4 flex items-center">
                                                                <div className="flex-grow border-t border-red-200 dark:border-red-900/50"></div>
                                                                <span className="flex-shrink-0 mx-4 text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                                                    New since last visit
                                                                </span>
                                                                <div className="flex-grow border-t border-red-200 dark:border-red-900/50"></div>
                                                            </div>
                                                        )}
                                                        <div className={`group relative ${isNew ? 'bg-blue-50/30 dark:bg-blue-900/5 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                                                            <div className="flex items-baseline justify-between mb-1">
                                                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{comment.author_name}</span>
                                                                <span className="text-[10px] text-zinc-400">{formatDate(comment.created_at)}</span>
                                                            </div>
                                                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg rounded-tl-none">
                                                                {comment.body}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="activity" className="mt-4">
                                    <div className="space-y-4 pl-2 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
                                        {history.length === 0 ? (
                                            <div className="text-center py-6 pl-0">
                                                <p className="text-sm text-zinc-400">No activity recorded</p>
                                            </div>
                                        ) : (
                                            history.map(item => (
                                                <div key={item.id} className="relative pl-8 py-1">
                                                    <div className="absolute left-0 top-1.5 w-10 h-10 flex items-center justify-center">
                                                        <div className="w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-zinc-950 bg-zinc-300 dark:bg-zinc-700" />
                                                    </div>
                                                    <div className="text-sm">
                                                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.changed_by_name || 'System'}</span>
                                                        <span className="text-zinc-500 mx-1">{formatActivityMessage(item)}</span>
                                                    </div>
                                                    <div className="text-[10px] text-zinc-400 mt-0.5 font-medium">
                                                        {formatDate(item.created_at)}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Footer Save Engine */}
                <SheetFooter className="px-6 py-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0 sm:justify-between flex-row items-center">
                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                        {isDirty ? (
                            <span className="text-amber-500 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" /> Unsaved changes
                            </span>
                        ) : (
                            `Last saved: ${formatDate(activeTask.created_at)}` // Ideally last_updated
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className={`min-w-[100px] transition-all ${isDirty ? 'opacity-100 translate-y-0' : 'opacity-50'}`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
