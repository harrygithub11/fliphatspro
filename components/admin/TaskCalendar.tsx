'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Task {
    id: number;
    title: string;
    due_date: string | null;
    status: string;
    priority: string;
}

interface TaskCalendarProps {
    tasks: Task[];
    onDateClick: (date: Date) => void;
    onTaskClick: (task: Task) => void;
}

type ViewType = 'month' | 'week' | 'day';

export function TaskCalendar({ tasks, onDateClick, onTaskClick }: TaskCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewType, setViewType] = useState<ViewType>('month');

    const getMonthDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days in month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const getWeekDays = (date: Date) => {
        const days: Date[] = [];
        const dayOfWeek = date.getDay();
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - dayOfWeek);

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }

        return days;
    };

    const getTasksForDate = (date: Date | null) => {
        if (!date) return [];
        const dateStr = date.toISOString().split('T')[0];
        return tasks.filter(task => {
            if (!task.due_date) return false;
            return task.due_date.startsWith(dateStr);
        });
    };

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + (direction * 7));
        setCurrentDate(newDate);
    };

    const navigateDay = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + direction);
        setCurrentDate(newDate);
    };

    const navigate = (direction: number) => {
        if (viewType === 'month') navigateMonth(direction);
        else if (viewType === 'week') navigateWeek(direction);
        else navigateDay(direction);
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getPriorityColor = (priority: string) => {
        if (priority === 'high') return 'bg-red-500';
        if (priority === 'medium') return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const monthDays = viewType === 'month' ? getMonthDays(currentDate) : [];
    const weekDays = viewType === 'week' ? getWeekDays(currentDate) : [];

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                    >
                        Today
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(1)}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <h2 className="text-lg font-semibold ml-2">
                        {viewType === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        {viewType === 'week' && `Week of ${weekDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {viewType === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h2>
                </div>

                {/* View Type Toggles */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
                    <Button
                        variant={viewType === 'day' ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-7 px-3 rounded-md text-xs font-medium ${viewType === 'day' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                        onClick={() => setViewType('day')}
                    >
                        Day
                    </Button>
                    <Button
                        variant={viewType === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-7 px-3 rounded-md text-xs font-medium ${viewType === 'week' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                        onClick={() => setViewType('week')}
                    >
                        Week
                    </Button>
                    <Button
                        variant={viewType === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        className={`h-7 px-3 rounded-md text-xs font-medium ${viewType === 'month' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                        onClick={() => setViewType('month')}
                    >
                        Month
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            {viewType === 'month' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {monthDays.map((date, idx) => {
                            const dayTasks = getTasksForDate(date);
                            const isCurrentMonth = date?.getMonth() === currentDate.getMonth();

                            return (
                                <div
                                    key={idx}
                                    className={cn(
                                        "min-h-[120px] border-r border-b border-zinc-200 dark:border-zinc-800 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group",
                                        !isCurrentMonth && "bg-zinc-50/50 dark:bg-zinc-900/50",
                                        (idx + 1) % 7 === 0 && "border-r-0"
                                    )}
                                    onClick={() => date && onDateClick(date)}
                                >
                                    {date && (
                                        <>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    isToday(date) && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs",
                                                    !isCurrentMonth && "text-zinc-400"
                                                )}>
                                                    {date.getDate()}
                                                </span>
                                                {date && (
                                                    <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 text-zinc-400" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                {dayTasks.slice(0, 3).map(task => (
                                                    <div
                                                        key={task.id}
                                                        className="text-xs p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 truncate flex items-center gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTaskClick(task);
                                                        }}
                                                    >
                                                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getPriorityColor(task.priority))} />
                                                        <span className="truncate">{task.title}</span>
                                                    </div>
                                                ))}
                                                {dayTasks.length > 3 && (
                                                    <div className="text-xs text-zinc-500 pl-1">
                                                        +{dayTasks.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Week View */}
            {viewType === 'week' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="grid grid-cols-7">
                        {weekDays.map((date, idx) => {
                            const dayTasks = getTasksForDate(date);

                            return (
                                <div
                                    key={idx}
                                    className="border-r border-zinc-200 dark:border-zinc-800 last:border-r-0"
                                >
                                    <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 text-center">
                                        <div className="text-xs font-semibold text-zinc-500 uppercase">
                                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                        <div className={cn(
                                            "text-lg font-bold mt-1",
                                            isToday(date) && "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto text-sm"
                                        )}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                    <div
                                        className="p-3 min-h-[400px] hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                                        onClick={() => onDateClick(date)}
                                    >
                                        <div className="space-y-2">
                                            {dayTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="text-sm p-2 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTaskClick(task);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={cn("w-2 h-2 rounded-full", getPriorityColor(task.priority))} />
                                                        <span className="font-medium truncate">{task.title}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Day View */}
            {viewType === 'day' && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <div className="space-y-4">
                        <div
                            className="flex items-center justify-between p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group"
                            onClick={() => onDateClick(currentDate)}
                        >
                            <span className="text-sm text-zin c-500">Click to create a new task for this day</span>
                            <Plus className="w-5 h-5 text-zinc-400 group-hover:text-primary" />
                        </div>

                        {getTasksForDate(currentDate).length === 0 ? (
                            <div className="text-center py-12 text-zinc-400">
                                No tasks scheduled for this day
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getTasksForDate(currentDate).map(task => (
                                    <div
                                        key={task.id}
                                        className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors border border-zinc-200 dark:border-zinc-700"
                                        onClick={() => onTaskClick(task)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("w-3 h-3 rounded-full", getPriorityColor(task.priority))} />
                                            <div className="flex-1">
                                                <h4 className="font-medium">{task.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {task.status.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {task.priority.toUpperCase()}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
