'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2, Circle, Clock, Plus, MoreHorizontal,
    Calendar, MessageSquare, Flag, User, ChevronDown, ChevronRight,
    GripVertical, Trash2, Copy, Edit3
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
}

interface TeamMember {
    id: number;
    name: string;
    email?: string;
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
}

const STATUS_CONFIG = {
    done: {
        label: 'COMPLETE',
        icon: CheckCircle2,
        color: 'text-green-500',
        bgColor: 'bg-green-500',
        badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30',
    },
    in_progress: {
        label: 'IN PROGRESS',
        icon: Clock,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    open: {
        label: 'TO DO',
        icon: Circle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500',
        badgeClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
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
}) {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const statusConfig = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.open;
    const priorityConfig = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.medium;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
    };

    return (
        <div className="group flex items-center gap-2 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 transition-colors">
            {/* Drag Handle */}
            <GripVertical className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 cursor-grab" />

            {/* Checkbox */}
            <Checkbox
                checked={isSelected}
                onCheckedChange={onSelect}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />

            {/* Status Indicator */}
            <button
                onClick={(e) => { e.stopPropagation(); onStatusChange(task.status === 'done' ? 'open' : 'done'); }}
                className="flex-shrink-0"
            >
                {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                    <Circle className="w-5 h-5 text-zinc-400 hover:text-green-500 transition-colors" />
                )}
            </button>

            {/* Task Title */}
            <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={onTaskClick}
            >
                <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                    {task.title}
                </span>
                {task.customer_name && (
                    <Link
                        href={`/admin/leads/${task.customer_id}`}
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
                        <AvatarFallback className="text-xs bg-zinc-200 dark:bg-zinc-700">
                            {task.assigned_name ? task.assigned_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                        </AvatarFallback>
                    </Avatar>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {team.map(member => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
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
            <div className="w-12 text-xs text-zinc-500 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {task.comments_count || 0}
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
    onDelete,
    onDuplicate,
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
    onDelete: (taskId: number) => void;
    onDuplicate: (taskId: number) => void;
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
                <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2">
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
                    onClick={() => setQuickAddOpen(true)}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add Task
                </Button>
            </div>

            {/* Column Headers (only show if not collapsed and has tasks) */}
            {!collapsed && tasks.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-1 text-xs font-medium text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="w-4" /> {/* grip */}
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => onSelectAll(!!checked)}
                        className="mr-1"
                    />
                    <div className="w-5" /> {/* status icon */}
                    <div className="flex-1">Name</div>
                    <div className="w-10 text-center">Assignee</div>
                    <div className="w-24">Due date</div>
                    <div className="w-24">Priority</div>
                    <div className="w-28">Status</div>
                    <div className="w-12">Comments</div>
                    <div className="w-7" /> {/* actions */}
                </div>
            )}

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
                        />
                    ))}

                    {/* Quick Add Row */}
                    {quickAddOpen && (
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <div className="w-4" />
                            <div className="w-4" />
                            <Circle className="w-5 h-5 text-zinc-300" />
                            <Input
                                autoFocus
                                placeholder="Task name..."
                                value={quickAddTitle}
                                onChange={(e) => setQuickAddTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleQuickAdd();
                                    if (e.key === 'Escape') { setQuickAddOpen(false); setQuickAddTitle(''); }
                                }}
                                className="flex-1 h-8 border-0 bg-transparent focus-visible:ring-0 text-sm"
                            />
                            <Button size="sm" className="h-7" onClick={handleQuickAdd}>Add</Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => { setQuickAddOpen(false); setQuickAddTitle(''); }}>Cancel</Button>
                        </div>
                    )}

                    {/* Inline Add Task */}
                    {!quickAddOpen && (
                        <button
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-zinc-400 hover:text-primary hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            onClick={() => setQuickAddOpen(true)}
                        >
                            <div className="w-4" />
                            <div className="w-4" />
                            <Plus className="w-4 h-4" />
                            <span>Add Task</span>
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
    onDelete,
    onDuplicate,
    selectedTasks,
    onSelectTask,
    onSelectAll,
}: TaskListViewProps) {
    // Group tasks by status
    const groupedTasks = {
        done: tasks.filter(t => t.status === 'done'),
        in_progress: tasks.filter(t => t.status === 'in_progress'),
        open: tasks.filter(t => t.status === 'open'),
    };

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-white dark:bg-zinc-950">
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
                onDelete={onDelete}
                onDuplicate={onDuplicate}
            />
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
                onDelete={onDelete}
                onDuplicate={onDuplicate}
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
                onDelete={onDelete}
                onDuplicate={onDuplicate}
            />
        </div>
    );
}
