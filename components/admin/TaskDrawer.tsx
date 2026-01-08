'use client';

import React, { useState, useEffect } from 'react';
import {
    X, Calendar, User, Flag, MessageSquare, Clock,
    Paperclip, Activity, Send, ChevronRight
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
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

interface TaskDrawerProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    team: TeamMember[];
    onUpdate: (taskId: number, updates: Partial<Task>) => void;
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
    onUpdate,
    onAddComment,
}: TaskDrawerProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState('');
    const [descriptionValue, setDescriptionValue] = useState('');

    useEffect(() => {
        if (task && isOpen) {
            setTitleValue(task.title);
            setDescriptionValue(task.description || '');
            fetchTaskDetails();
        }
    }, [task?.id, isOpen]);

    const fetchTaskDetails = async () => {
        if (!task) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tasks/${task.id}`);
            const data = await res.json();
            if (data.success) {
                setComments(data.comments || []);
                setHistory(data.history || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!task || !newComment.trim()) return;
        try {
            await fetch(`/api/admin/tasks/${task.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ body: newComment }),
            });
            setNewComment('');
            fetchTaskDetails();
            onAddComment(task.id, newComment);
        } catch (e) {
            console.error(e);
        }
    };

    const handleTitleBlur = () => {
        if (task && titleValue !== task.title) {
            onUpdate(task.id, { title: titleValue });
        }
        setEditingTitle(false);
    };

    const handleDescriptionBlur = () => {
        if (task && descriptionValue !== (task.description || '')) {
            onUpdate(task.id, { description: descriptionValue });
        }
    };

    const formatDate = (dateStr: string) => {
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
            case 'status_change':
                return `changed status from "${item.old_value}" to "${item.new_value}"`;
            case 'priority_change':
                return `changed priority from "${item.old_value}" to "${item.new_value}"`;
            case 'assigned':
                return `assigned to ${item.new_value || 'someone'}`;
            case 'comment_added':
                return 'added a comment';
            case 'created':
                return 'created this task';
            default:
                return `updated ${item.field_name || 'task'}`;
        }
    };

    if (!task) return null;

    const statusConfig = STATUS_CONFIG[task.status];
    const priorityConfig = PRIORITY_CONFIG[task.priority];

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl p-0 overflow-hidden">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-start gap-3">
                            <div className={`w-3 h-3 rounded-full mt-2 ${statusConfig.color}`} />
                            <div className="flex-1">
                                {editingTitle ? (
                                    <Input
                                        autoFocus
                                        value={titleValue}
                                        onChange={(e) => setTitleValue(e.target.value)}
                                        onBlur={handleTitleBlur}
                                        onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                        className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                                    />
                                ) : (
                                    <SheetTitle
                                        className="text-lg font-semibold cursor-pointer hover:text-primary"
                                        onClick={() => setEditingTitle(true)}
                                    >
                                        {task.title}
                                    </SheetTitle>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className={priorityConfig.color}>
                                        <Flag className="w-3 h-3 mr-1" />
                                        {priorityConfig.label}
                                    </Badge>
                                    <Badge variant="outline" className={statusConfig.textColor}>
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </SheetHeader>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1 mb-1">
                                        <User className="w-3 h-3" /> Assignee
                                    </label>
                                    <Select
                                        value={task.assigned_to?.toString() || 'unassigned'}
                                        onValueChange={(val) => onUpdate(task.id, { assigned_to: val === 'unassigned' ? undefined : parseInt(val) })}
                                    >
                                        <SelectTrigger className="h-9">
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
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1 mb-1">
                                        <Calendar className="w-3 h-3" /> Due Date
                                    </label>
                                    <Input
                                        type="datetime-local"
                                        value={task.due_date ? task.due_date.slice(0, 16) : ''}
                                        onChange={(e) => onUpdate(task.id, { due_date: e.target.value })}
                                        className="h-9"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1 mb-1">
                                        <Flag className="w-3 h-3" /> Priority
                                    </label>
                                    <Select
                                        value={task.priority}
                                        onValueChange={(val) => onUpdate(task.id, { priority: val as any })}
                                    >
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">Urgent</SelectItem>
                                            <SelectItem value="medium">Normal</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 flex items-center gap-1 mb-1">
                                        <Clock className="w-3 h-3" /> Status
                                    </label>
                                    <Select
                                        value={task.status}
                                        onValueChange={(val) => onUpdate(task.id, { status: val as any })}
                                    >
                                        <SelectTrigger className="h-9">
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

                            {/* Description */}
                            <div>
                                <label className="text-xs font-medium text-zinc-500 mb-2 block">Description</label>
                                <Textarea
                                    placeholder="Add a description..."
                                    value={descriptionValue}
                                    onChange={(e) => setDescriptionValue(e.target.value)}
                                    onBlur={handleDescriptionBlur}
                                    className="min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Tabs for Comments & Activity */}
                            <Tabs defaultValue="comments" className="w-full">
                                <TabsList className="w-full grid grid-cols-2">
                                    <TabsTrigger value="comments" className="text-xs">
                                        <MessageSquare className="w-3 h-3 mr-1" /> Comments ({comments.length})
                                    </TabsTrigger>
                                    <TabsTrigger value="activity" className="text-xs">
                                        <Activity className="w-3 h-3 mr-1" /> Activity ({history.length})
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="comments" className="mt-4 space-y-4">
                                    {/* Comment Input */}
                                    <div className="flex gap-2">
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback className="text-xs">U</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 flex gap-2">
                                            <Input
                                                placeholder="Write a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                            />
                                            <Button size="icon" onClick={handleAddComment}>
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Comments List */}
                                    {comments.length === 0 ? (
                                        <p className="text-center text-sm text-zinc-500 py-4">No comments yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {comments.map(comment => (
                                                <div key={comment.id} className="flex gap-2">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-xs">
                                                            {comment.author_name?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-sm font-medium">{comment.author_name}</span>
                                                            <span className="text-xs text-zinc-500">{formatDate(comment.created_at)}</span>
                                                        </div>
                                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{comment.body}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="activity" className="mt-4">
                                    {history.length === 0 ? (
                                        <p className="text-center text-sm text-zinc-500 py-4">No activity yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {history.map(item => (
                                                <div key={item.id} className="flex gap-2 text-sm">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                        <ChevronRight className="w-3 h-3" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="font-medium">{item.changed_by_name || 'Someone'}</span>
                                                        <span className="text-zinc-500 ml-1">{formatActivityMessage(item)}</span>
                                                        <div className="text-xs text-zinc-400 mt-0.5">{formatDate(item.created_at)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>Created {formatDate(task.created_at)} {task.created_by_name && `by ${task.created_by_name}`}</span>
                            {task.customer_name && (
                                <span>Customer: <span className="text-primary">{task.customer_name}</span></span>
                            )}
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
