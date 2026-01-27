'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, MoreHorizontal, Filter, List, Kanban as KanbanIcon, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Types ---
interface Order {
    id: number;
    razorpay_order_id: string;
    amount: string;
    status: string;
    onboarding_status: string;
    created_at: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

interface KanbanCard {
    id: number | null;
    customer_id: number;
    razorpay_order_id: string;
    customer_name: string;
    brand_name: string;
    amount: string;
    status: string;
    created_at: string;
}

const KANBAN_COLUMNS = [
    { id: 'new_lead', label: 'New Lead', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'initiated', label: 'Order Created', color: 'bg-zinc-100 dark:bg-zinc-800' },
    { id: 'payment_failed', label: 'Payment Failed', color: 'bg-red-50 dark:bg-red-900/20' },
    { id: 'paid', label: 'Paid - Pending Form', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'onboarding_pending', label: 'In Queue', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { id: 'processing', label: 'In Progress', color: 'bg-purple-50 dark:bg-purple-900/20' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-50 dark:bg-green-900/20' },
];

export default function OrdersPage() {
    const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
    const [orders, setOrders] = useState<Order[]>([]);
    const [kanbanData, setKanbanData] = useState<KanbanCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);

    // Initial Load
    useEffect(() => {
        fetchData();
    }, [viewMode]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (viewMode === 'list') {
                const res = await fetch('/api/admin/orders');
                const data = await res.json();
                if (Array.isArray(data)) setOrders(data);
            } else {
                const res = await fetch('/api/admin/kanban');
                const data = await res.json();
                if (Array.isArray(data)) setKanbanData(data);
            }
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    const createDummyOrder = async () => {
        await fetch('/api/admin/orders', { method: 'POST' });
        fetchData();
    };

    const deleteOrder = async (id: number) => {
        if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setOrders(orders.filter(o => o.id !== id));
            } else {
                alert('Failed to delete order');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // --- View Helpers ---
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
            case 'initiated': return <Badge variant="secondary">Initiated</Badge>;
            case 'payment_failed': return <Badge variant="destructive">Failed</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getOnboardingBadge = (status: string) => {
        switch (status) {
            case 'completed': return <Badge className="bg-blue-500 hover:bg-blue-600">Completed</Badge>;
            case 'pending': return <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Pending</Badge>;
            default: return null;
        }
    };

    // --- Kanban Helpers ---
    const handleDrop = async (e: React.DragEvent, status: string) => {
        e.preventDefault();
        if (draggedOrderId === null) return;

        // Optimistic UI Update
        const oldData = [...kanbanData];
        const newData = kanbanData.map(o => o.id === draggedOrderId ? { ...o, status } : o);
        setKanbanData(newData);
        setDraggedOrderId(null);

        try {
            const res = await fetch('/api/admin/kanban', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: draggedOrderId, newStatus: status })
            });
            if (!res.ok) {
                setKanbanData(oldData);
                alert("Failed to update status");
            }
        } catch (e) {
            setKanbanData(oldData);
            console.error(e);
        }
    };

    // --- Filtering ---
    const filteredOrders = orders.filter(order =>
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.razorpay_order_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders & Projects</h1>
                    <p className="text-muted-foreground">Manage transactions and delivery workflow.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(viewMode === 'list' ? 'bg-white dark:bg-zinc-900 shadow-sm' : '')}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="w-4 h-4 mr-2" /> List
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(viewMode === 'board' ? 'bg-white dark:bg-zinc-900 shadow-sm' : '')}
                            onClick={() => setViewMode('board')}
                        >
                            <KanbanIcon className="w-4 h-4 mr-2" /> Board
                        </Button>
                    </div>

                    {viewMode === 'list' && (
                        <>
                            <Button variant="outline" onClick={createDummyOrder}>+ Create Order</Button>
                            <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter</Button>
                            <Button>Export CSV</Button>
                        </>
                    )}
                    {viewMode === 'board' && (
                        <Button variant="outline" size="sm" onClick={fetchData}>Refresh Board</Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : viewMode === 'list' ? (
                // --- LIST VIEW ---
                <Card className="flex-1 overflow-hidden flex flex-col">
                    <CardHeader className="shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Transactions</CardTitle>
                            <div className="relative w-72">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search orders..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader className="sticky top-0 bg-white dark:bg-black z-10 shadow-sm">
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Onboarding</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No orders found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">{order.razorpay_order_id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{order.customer_name}</span>
                                                    <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>{getOnboardingBadge(order.onboarding_status)}</TableCell>
                                            <TableCell className="text-right font-bold">₹{order.amount}</TableCell>
                                            <TableCell className="text-right text-muted-foreground text-sm">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.razorpay_order_id)}>
                                                            Copy Order ID
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem asChild>
                                                            <a href={`/admin/orders/${order.id}`}>View Full Details</a>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            onClick={() => deleteOrder(order.id)}
                                                        >
                                                            Delete Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                // --- BOARD VIEW (KANBAN) ---
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-4 h-full min-w-[1200px]">
                        {KANBAN_COLUMNS.map(col => (
                            <div
                                key={col.id}
                                className={`flex-1 min-w-[280px] rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col ${col.color}`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="p-3 border-b border-zinc-200/50 dark:border-zinc-700/50 flex justify-between items-center bg-white/50 dark:bg-zinc-900/50 rounded-t-xl backdrop-blur-sm">
                                    <span className="font-semibold text-sm">{col.label}</span>
                                    <Badge variant="secondary" className="rounded-full h-5 px-1.5 text-[10px]">
                                        {kanbanData.filter(o => o.status === col.id).length}
                                    </Badge>
                                </div>

                                <div className="p-2 flex-1 overflow-y-auto space-y-2">
                                    {kanbanData.filter(o => o.status === col.id).map(order => (
                                        <div
                                            key={order.id || `lead-${order.customer_id}`}
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
            )}
        </div>
    );
}
