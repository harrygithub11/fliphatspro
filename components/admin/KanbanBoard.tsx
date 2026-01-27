'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, AlertCircle, User, Package } from 'lucide-react';
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
    related_order_id?: number;
}

interface KanbanBoardProps {
    tasks: Task[];
    onStatusChange: (taskId: number, newStatus: string) => void;
    onTaskClick?: (task: Task) => void;
}

const COLUMNS = [
    { id: 'open', title: 'Open', color: 'bg-zinc-100 dark:bg-zinc-800' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/30' },
    { id: 'done', title: 'Done', color: 'bg-green-50 dark:bg-green-950/30' },
];

export function KanbanBoard({ tasks, onStatusChange, onTaskClick }: KanbanBoardProps) {
    const tasksByStatus = useMemo(() => {
        const grouped: Record<string, Task[]> = {
            open: [],
            in_progress: [],
            done: [],
        };
        tasks.forEach(task => {
            if (grouped[task.status]) {
                grouped[task.status].push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const handleDragStart = (e: React.DragEvent, taskId: number) => {
        e.dataTransfer.setData('taskId', String(taskId));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('taskId'));
        if (taskId) {
            onStatusChange(taskId, newStatus);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-zinc-400';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[500px]">
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    className={`rounded-xl p-4 ${column.color} transition-colors`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                            {column.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                            {tasksByStatus[column.id].length}
                        </Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                        {tasksByStatus[column.id].map(task => (
                            <Card
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => onTaskClick?.(task)}
                                className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-white dark:bg-zinc-900 border-l-4"
                                style={{ borderLeftColor: getPriorityColor(task.priority).replace('bg-', '#').replace('-500', '') }}
                            >
                                {/* Priority Dot + Title */}
                                <div className="flex items-start gap-2">
                                    <div className={`w-2 h-2 rounded-full mt-1.5 ${getPriorityColor(task.priority)}`} />
                                    <h4 className={`font-medium text-sm flex-1 ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                    </h4>
                                </div>

                                {/* Meta Row */}
                                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground flex-wrap">
                                    {/* Due Date */}
                                    {task.due_date && (
                                        <div className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : ''}`}>
                                            <Calendar className="w-3 h-3" />
                                            {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    )}

                                    {/* Customer */}
                                    {task.customer_name && (
                                        <Link href={`leads/${task.customer_id}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                                            <User className="w-3 h-3" />
                                            {task.customer_name.split(' ')[0]}
                                        </Link>
                                    )}

                                    {/* Related Order */}
                                    {task.related_order_id && (
                                        <Link href={`orders/${task.related_order_id}`} className="flex items-center gap-1 text-amber-600">
                                            <Package className="w-3 h-3" />
                                            #{task.related_order_id}
                                        </Link>
                                    )}
                                </div>

                                {/* Assignee Avatar */}
                                {task.assigned_name && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <Avatar className="w-5 h-5">
                                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                                {task.assigned_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs text-muted-foreground">{task.assigned_name}</span>
                                    </div>
                                )}
                            </Card>
                        ))}

                        {tasksByStatus[column.id].length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No tasks
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
