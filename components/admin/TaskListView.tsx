'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2, Circle, Clock, Plus, MoreHorizontal,
    Calendar, MessageSquare, Flag, User, ChevronDown, ChevronRight,
    GripVertical, Trash2, Copy, Edit3
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Task {
    id: number;
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string | null;
    assigned_to?: number;
    assigned_name?: string;
    customer_id?: number;
    customer_name?: string;
    customer_email?: string;
    created_at: string;
    comments_count?: number;
    is_unread?: number;
    unread_comments_count?: number;
}

interface TeamMember {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string;
}

interface TaskListViewProps {
    tasks: Task[];
    team: TeamMember[];
    onStatusChange: (taskId: number, newStatus: string) => void;
    onPriorityChange: (taskId: number, newPriority: string) => void;
    onAssigneeChange: (taskId: number, userId: number | null) => void;
    onTaskClick: (task: Task) => void;
    onQuickAdd: (status: string, title: string) => void;
    onDelete: (taskId: number) => void;
    onDuplicate: (taskId: number) => void;
    selectedTasks: number[];
    onSelectTask: (taskId: number, selected: boolean) => void;
    onSelectAll: (status: string, selected: boolean) => void;
    onOpenCreateTask: (status: string) => void;
    highlightedTaskId?: number | null;
}

const STATUS_CONFIG = {
    done: {
        label: 'COMPLETE',
        icon: CheckCircle2,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30 shadow-sm backdrop-blur-sm',
    },
    in_progress: {
        label: 'IN PROGRESS',
        icon: Clock,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500',
        badgeClass: 'bg-blue-100/80 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30 shadow-sm backdrop-blur-sm',
    },
    open: {
        label: 'TO DO',
        icon: Circle,
        color: 'text-zinc-600 dark:text-zinc-400',
        bgColor: 'bg-zinc-500',
        badgeClass: 'bg-white text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 shadow-sm',
    },
};

const PRIORITY_CONFIG = {
    high: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-500' },
    medium: { label: 'Normal', color: 'text-amber-500', bgColor: 'bg-amber-500' },
    low: { label: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-400' },
};

function TaskRow({
    task,
    team,
    isSelected,
    onSelect,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onTaskClick,
    onDelete,
    onDuplicate,
    isHighlighted,
}: {
    task: Task;
    team: TeamMember[];
    isSelected: boolean;
    onSelect: (selected: boolean) => void;
    onStatusChange: (status: string) => void;
    onPriorityChange: (priority: string) => void;
    onAssigneeChange: (userId: number | null) => void;
    onTaskClick: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    isHighlighted?: boolean;
}) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
    const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    };

    return (
        <div className={`group flex items-center gap-2 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 transition-all duration-500 ${isHighlighted ? 'bg-amber-50 dark:bg-amber-900/20 ring-2 ring-amber-400 dark:ring-amber-500 ring-inset animate-pulse' : ''}`}>
            {/* Drag Handle */}
            <GripVertical className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 cursor-grab" />



            {/* Status Indicator */}
            <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(task.status === 'done' ? 'open' : 'done'); }}
                className="flex-shrink-0"
            >
                {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                    <Circle className="w-5 h-5 text-zinc-400 hover:text-emerald-500 transition-colors" />
                )}
            </button>

            {/* Task Title */}
            <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={onTaskClick}
            >
                <div className="flex items-center gap-2">
                    {task.is_unread ? (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" title="Unread activity" />
                    ) : null}
                    <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {task.title}
                    </span>
                </div>
                {task.customer_name && (
                    <Link
                        href={`leads/${task.customer_id}`}
                        className="ml-2 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {task.customer_name}
                    </Link>
                )}
            </div>

            {/* Assignee */}
            <Select
                value={task.assigned_to?.toString() || 'unassigned'}
                onValueChange={(val) => onAssigneeChange(val === 'unassigned' ? null : parseInt(val))}
            >
                <SelectTrigger className="w-10 h-8 border-0 bg-transparent p-0 justify-center">
                    <Avatar className="w-7 h-7">
                        {(() => {
                            const assignedMember = team.find(m => m.id === task.assigned_to);
                            return (
                                <>
                                    {assignedMember?.avatar_url && (
                                        <AvatarImage
                                            src={assignedMember.avatar_url}
                                            alt={task.assigned_name || ''}
                                            className="object-cover"
                                        />
                                    )}
                                    <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700">
                                        {task.assigned_name ? task.assigned_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                                    </AvatarFallback>
                                </>
                            );
                        })()}
                    </Avatar>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {team.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                            <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                    {member.avatar_url && <AvatarImage src={member.avatar_url} className="object-cover" />}
                                    <AvatarFallback className="text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {member.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Due Date */}
            <div className={`w-24 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-zinc-500'}`}>
                {task.due_date ? (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(task.due_date)}
                    </span>
                ) : (
                    <span className="text-zinc-400">—</span>
                )}
            </div>

            {/* Priority */}
            <Select value={task.priority} onValueChange={onPriorityChange}>
                <SelectTrigger className="w-24 h-7 text-xs border-0 bg-transparent">
                    <div className="flex items-center gap-1">
                        <Flag className={`w-3 h-3 ${priorityConfig.color}`} />
                        <span>{priorityConfig.label}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="high"><span className="flex items-center gap-2"><Flag className="w-3 h-3 text-red-500" /> Urgent</span></SelectItem>
                    <SelectItem value="medium"><span className="flex items-center gap-2"><Flag className="w-3 h-3 text-amber-500" /> Normal</span></SelectItem>
                    <SelectItem value="low"><span className="flex items-center gap-2"><Flag className="w-3 h-3 text-gray-400" /> Low</span></SelectItem>
                </SelectContent>
            </Select>

            {/* Status Dropdown */}
            <Select value={task.status} onValueChange={onStatusChange}>
                <SelectTrigger className="w-28 h-7 text-xs border-0 bg-transparent">
                    <Badge className={`${statusConfig.badgeClass} text-xs px-2 py-0.5`}>
                        {statusConfig.label}
                    </Badge>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="open">TO DO</SelectItem>
                    <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                    <SelectItem value="done">COMPLETE</SelectItem>
                </SelectContent>
            </Select>

            {/* Comments */}
            <div className={`w-20 text-xs flex items-center gap-1 ${task.unread_comments_count ? 'text-blue-600 font-bold' : 'text-zinc-500'}`}>
                <MessageSquare className="w-3 h-3" />
                {task.unread_comments_count ? (
                    <Badge className="h-4 px-1 text-[10px] bg-blue-500 hover:bg-blue-600 border-none text-white leading-none min-w-[16px] justify-center">
                        {task.unread_comments_count}
                    </Badge>
                ) : (
                    task.comments_count || 0
                )}
            </div>

            {/* Row Actions */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onTaskClick}>
                        <Edit3 className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDuplicate}>
                        <Copy className="w-4 h-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onDelete} className="text-red-500">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

function StatusGroup({
    status,
    tasks,
    team,
    selectedTasks,
    onSelectTask,
    onSelectAll,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onTaskClick,
    onQuickAdd,
    onOpenCreateTask,
    onDelete,
    onDuplicate,
    highlightedTaskId,
}: {
    status: 'open' | 'in_progress' | 'done';
    tasks: Task[];
    team: TeamMember[];
    selectedTasks: number[];
    onSelectTask: (taskId: number, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
    onStatusChange: (taskId: number, status: string) => void;
    onPriorityChange: (taskId: number, priority: string) => void;
    onAssigneeChange: (taskId: number, userId: number | null) => void;
    onTaskClick: (task: Task) => void;
    onQuickAdd: (title: string) => void;
    onOpenCreateTask: (status: string) => void;
    onDelete: (taskId: number) => void;
    onDuplicate: (taskId: number) => void;
    highlightedTaskId?: number | null;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddTitle, setQuickAddTitle] = useState('');

    const config = STATUS_CONFIG[status];
    const StatusIcon = config.icon;
    const allSelected = tasks.length > 0 && tasks.every(t => selectedTasks.includes(t.id));

    const handleQuickAdd = () => {
        if (quickAddTitle.trim()) {
            onQuickAdd(quickAddTitle.trim());
            setQuickAddTitle('');
            setQuickAddOpen(false);
        }
    };

    return (
        <div className="mb-4">
            {/* Group Header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-y border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 text-left">
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    <Badge className={`${config.badgeClass} text-xs font-semibold`}>
                        {config.label}
                    </Badge>
                    <span className="text-xs text-zinc-500">{tasks.length}</span>
                </button>

                <div className="flex-1" />

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-zinc-500 hover:text-primary"
                    onClick={() => onOpenCreateTask(status)}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Task
                </Button>
            </div>

            {/* Tasks */}
            {!collapsed && (
                <div>
                    {tasks.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            team={team}
                            isSelected={selectedTasks.includes(task.id)}
                            onSelect={(selected) => onSelectTask(task.id, selected)}
                            onStatusChange={(s) => onStatusChange(task.id, s)}
                            onPriorityChange={(p) => onPriorityChange(task.id, p)}
                            onAssigneeChange={(u) => onAssigneeChange(task.id, u)}
                            onTaskClick={() => onTaskClick(task)}
                            onDelete={() => onDelete(task.id)}
                            onDuplicate={() => onDuplicate(task.id)}
                            isHighlighted={highlightedTaskId === task.id}
                        />
                    ))}

                    {/* Quick Add Row - Hidden by default now, accessible if needed or can be removed if user dislikes. 
                        I'll keep the logic but the button above now triggers the Modal.
                        I'll add a 'Quick Add' text button below the list for the simple version if they really want it.
                    */}

                    {quickAddOpen && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 animate-in slide-in-from-top-1 duration-200">
                            <div className="w-4" /> {/* Grip placeholder */}

                            <StatusIcon className={`w-5 h-5 ${config.color} opacity-50`} />

                            <Input
                                autoFocus
                                value={quickAddTitle}
                                onChange={(e) => setQuickAddTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickAdd();
                                    if (e.key === 'Escape') {
                                        setQuickAddOpen(false);
                                        setQuickAddTitle('');
                                    }
                                }}
                                onBlur={() => {
                                    if (quickAddTitle.trim()) handleQuickAdd();
                                    else setQuickAddOpen(false);
                                }}
                                placeholder={`+ Type name for new ${config.label.toLowerCase()} task...`}
                                className="flex-1 h-8 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-1 focus:ring-primary/20"
                            />

                            <div className="flex items-center gap-2">
                                <Button size="sm" onClick={handleQuickAdd} className="h-7 text-xs">Add</Button>
                                <Button size="sm" variant="ghost" onClick={() => setQuickAddOpen(false)} className="h-7 text-xs">Cancel</Button>
                            </div>
                        </div>
                    )}

                    {/* Button to show inline quick add */}
                    {!quickAddOpen && (
                        <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            onClick={() => setQuickAddOpen(true)}
                        >
                            <div className="w-4" />
                            <div className="w-4" />
                            <Plus className="w-4 h-4" />
                            <span>Quick Add Line</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TaskListView({
    tasks,
    team,
    onStatusChange,
    onPriorityChange,
    onAssigneeChange,
    onTaskClick,
    onQuickAdd,
    onOpenCreateTask,
    onDelete,
    onDuplicate,
    selectedTasks,
    onSelectTask,
    onSelectAll,
    highlightedTaskId,
}: TaskListViewProps) {
    // Group tasks by status
    const groupedTasks = {
        done: tasks.filter(t => t.status === 'done'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        open: tasks.filter(t => t.status === 'open'),
    };

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
            {/* Unified Column Header */}
            <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <div className="w-4" /> {/* grip */}

                <div className="w-5" /> {/* icon */}
                <div className="flex-1">Name</div>
                <div className="w-10 text-center">Assignee</div>
                <div className="w-24 pl-2">Due date</div>
                <div className="w-24">Priority</div>
                <div className="w-28">Status</div>
                <div className="w-20">Comments</div>
                <div className="w-7 text-center"><Plus className="w-4 h-4 mx-auto" /></div> {/* actions */}
            </div>

            <StatusGroup
                status="in_progress"
                tasks={groupedTasks.in_progress}
                team={team}
                selectedTasks={selectedTasks}
                onSelectTask={onSelectTask}
                onSelectAll={(selected) => onSelectAll('in_progress', selected)}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onAssigneeChange={onAssigneeChange}
                onTaskClick={onTaskClick}
                onQuickAdd={(title) => onQuickAdd('in_progress', title)}
                onOpenCreateTask={onOpenCreateTask}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                highlightedTaskId={highlightedTaskId}
            />
            <StatusGroup
                status="open"
                tasks={groupedTasks.open}
                team={team}
                selectedTasks={selectedTasks}
                onSelectTask={onSelectTask}
                onSelectAll={(selected) => onSelectAll('open', selected)}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onAssigneeChange={onAssigneeChange}
                onTaskClick={onTaskClick}
                onQuickAdd={(title) => onQuickAdd('open', title)}
                onOpenCreateTask={onOpenCreateTask}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                highlightedTaskId={highlightedTaskId}
            />
            <StatusGroup
                status="done"
                tasks={groupedTasks.done}
                team={team}
                selectedTasks={selectedTasks}
                onSelectTask={onSelectTask}
                onSelectAll={(selected) => onSelectAll('done', selected)}
                onStatusChange={onStatusChange}
                onPriorityChange={onPriorityChange}
                onAssigneeChange={onAssigneeChange}
                onTaskClick={onTaskClick}
                onQuickAdd={(title) => onQuickAdd('done', title)}
                onOpenCreateTask={onOpenCreateTask}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                highlightedTaskId={highlightedTaskId}
            />
        </div>
    );
}
