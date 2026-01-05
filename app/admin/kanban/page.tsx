'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Kanban, DollarSign, User, Calendar } from 'lucide-react';

interface OrderCard {
    id: number | null;
    customer_id: number;
    razorpay_order_id: string;
    customer_name: string;
    brand_name: string;
    amount: string;
    status: string;
    created_at: string;
}

const COLUMNS = [
    { id: 'new_lead', label: 'New Lead', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'initiated', label: 'Order Created', color: 'bg-zinc-100 dark:bg-zinc-800' },
    { id: 'payment_failed', label: 'Payment Failed', color: 'bg-red-50 dark:bg-red-900/20' },
    { id: 'paid', label: 'Paid - Pending Form', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'onboarding_pending', label: 'In Queue', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'processing', label: 'In Progress', color: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-50 dark:bg-green-900/20' },
];

export default function KanbanPage() {
    const [orders, setOrders] = useState<OrderCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/kanban');
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to load kanban", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (draggedOrderId === null) return;

        // Optimistic UI Update
        const oldOrders = [...orders];
        const newOrders = orders.map(o => o.id === draggedOrderId ? { ...o, status } : o);
        setOrders(newOrders);
        setDraggedOrderId(null);

        try {
            const res = await fetch('/api/admin/kanban', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: draggedOrderId, newStatus: status })
            });

            if (!res.ok) {
                // Revert on failure
                setOrders(oldOrders);
                alert("Failed to update status");
            }
        } catch (e) {
            setOrders(oldOrders);
            console.error(e);
        }
    };

    if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Project Board</h1>
                    <p className="text-muted-foreground">Drag and drop cards to update status.</p>
                </div>
                <Button variant="outline" size="sm">Refresh Board</Button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {COLUMNS.map(col => (
                        <div
                            key={col.id}
                            className={`flex-1 min-w-[280px] rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col ${col.color}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            <div className="p-3 border-b border-zinc-200/50 dark:border-zinc-700/50 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 rounded-t-xl backdrop-blur-sm">
                                <span className="font-semibold text-sm">{col.label}</span>
                                <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">
                                    {orders.filter(o => o.status === col.id).length}
                                </Badge>
                            </div>

                            <div className="p-2 flex-1 overflow-y-auto space-y-2">
                                {orders.filter(o => o.status === col.id).map(order => (
                                    <div
                                        key={order.id}
                                        draggable
                                        onDragStart={() => setDraggedOrderId(order.id)}
                                        className="bg-white dark:bg-zinc-900 p-3 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-move hover:shadow-md transition-shadow group relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-mono text-[10px] text-muted-foreground">#{order.razorpay_order_id ? order.razorpay_order_id.slice(-6) : `L${order.customer_id}`}</span>
                                            <span className="font-bold text-xs">{order.amount ? `₹${Number(order.amount).toLocaleString()}` : '-'}</span>
                                        </div>

                                        <h4 className="font-semibold text-sm line-clamp-1">{order.brand_name || order.customer_name}</h4>

                                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            </div>
                                            <a
                                                href={order.id ? `/admin/orders/${order.id}` : `/admin/leads/${order.customer_id}`}
                                                className="text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                                            >
                                                View
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
