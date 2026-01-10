
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Phone, MessageSquare, FileText, Activity, User, CheckCircle2, UserCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: number;
    type: string;
    content: string;
    created_at: string;
    created_by: number;
    created_by_name: string;
}

interface ThreadProps {
    customer: {
        customer_id: number;
        customer_name: string;
        customer_email: string;
        avatar_url?: string;
        last_activity_at: string;
        activity_count: number;
        activities: ActivityItem[];
    };
}

const getActionIcon = (type: string) => {
    if (type?.includes('call')) return <Phone className="w-3 h-3" />;
    if (type?.includes('whatsapp')) return <MessageSquare className="w-3 h-3" />;
    if (type?.includes('task')) return <CheckCircle2 className="w-3 h-3" />;
    if (type?.includes('lead') || type?.includes('customer')) return <User className="w-3 h-3" />;
    if (type?.includes('login')) return <UserCheck className="w-3 h-3" />;
    return <Activity className="w-3 h-3" />;
};

const getActionColor = (type: string) => {
    if (type?.includes('call')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    if (type?.includes('whatsapp')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    if (type?.includes('note')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    if (type?.includes('system')) return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
    return 'bg-zinc-100 text-zinc-600';
};

export function CustomerActivityThread({ customer }: ThreadProps) {
    const [expanded, setExpanded] = useState(false);

    // Show first activity always, others if expanded
    const visibleActivities = expanded ? customer.activities : [customer.activities[0]];
    const hasMore = customer.activities.length > 1;

    return (
        <div className="relative pl-6 pb-6 last:pb-0 border-l border-border/50 dark:border-zinc-800">
            {/* Timeline Connector Dot */}
            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-primary/20 ring-4 ring-background" />

            <div className="bg-card/50 dark:bg-zinc-900/20 rounded-lg border border-border/50 hover:border-border transition-colors">
                {/* Header */}
                <div
                    className="p-3 flex items-start justify-between cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
                    onClick={() => hasMore && setExpanded(!expanded)}
                >
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                            {customer.avatar_url ? (
                                <AvatarImage src={customer.avatar_url} />
                            ) : (
                                <AvatarFallback className="text-xs bg-primary/5 text-primary">
                                    {customer.customer_name?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium leading-none">{customer.customer_name}</h4>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                    {customer.activity_count} activities
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Last active {formatDistanceToNow(new Date(customer.last_activity_at), { addSuffix: true })}
                            </p>
                        </div>
                    </div>

                    {hasMore && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground">
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    )}
                </div>

                {/* Activities List */}
                <div className="border-t border-border/40 divide-y divide-border/30">
                    {visibleActivities.map((activity) => (
                        <div key={activity.id} className="p-3 pl-4 relative group">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`h-5 border text-[10px] px-1.5 gap-1 ${getActionColor(activity.type)}`}>
                                            {getActionIcon(activity.type)}
                                            <span className="uppercase tracking-wider font-semibold">
                                                {activity.type.replace(/_/g, ' ').replace('msg', '')}
                                            </span>
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">by {activity.created_by_name || 'System'}</span>
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed pl-1">
                                        {activity.content}
                                    </p>
                                </div>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                                    {new Date(activity.created_at).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {!expanded && hasMore && (
                        <div
                            className="p-2 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 hover:text-primary transition-colors"
                            onClick={() => setExpanded(true)}
                        >
                            View {customer.activities.length - 1} older updates
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
