'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Clock, AlertCircle, TrendingUp, Package, Video } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        totalLeads: 0,
        pendingOnboarding: 0,
        issues: 0,
        activity: [],
        chartData: [],
        statusBreakdown: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const data = await res.json();
                if (data.revenue !== undefined) {
                    setStats(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
                <p className="text-sm text-muted-foreground">Real-time business metrics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Revenue"
                    value={`₹${Number(stats.revenue).toLocaleString()}`}
                    icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
                    subtext="Lifetime Volume"
                    trend="+12.5%"
                />
                <KpiCard
                    title="Total Leads"
                    value={stats.totalLeads.toString()}
                    icon={<Users className="h-4 w-4 text-muted-foreground" />}
                    subtext="All time customers"
                    trend="+5.2%"
                />
                <KpiCard
                    title="Pending Onboarding"
                    value={stats.pendingOnboarding.toString()}
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                    subtext="Paid but form not filled"
                    trend={stats.pendingOnboarding > 0 ? "Action needed" : "All clear"}
                />
                <KpiCard
                    title="Issues"
                    value={stats.issues.toString()}
                    icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
                    subtext="Payment Failed"
                    trend={stats.issues > 0 ? "Needs attention" : "No issues"}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Revenue Overview (Last 7 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {stats.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={stats.chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs"
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis className="text-xs" />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                        formatter={(value: any) => [`₹${value}`, 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3b82f6"
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No revenue data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {stats.activity.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-8">No recent activity.</p>
                            )}
                            {stats.activity.map((item: any, i) => (
                                <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${item.status === 'delivered' ? 'bg-green-500' :
                                        item.status === 'processing' ? 'bg-blue-500' :
                                            item.status === 'paid' ? 'bg-purple-500' :
                                                item.status === 'payment_failed' ? 'bg-red-500' : 'bg-gray-500'
                                        }`}></div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {item.customer_name || 'Unknown Customer'}
                                            <span className="text-muted-foreground font-normal"> - {item.status.replace('_', ' ')}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Order #{item.razorpay_order_id?.slice(-6) || item.id} • {new Date(item.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="font-medium text-sm">₹{Number(item.amount).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Meetings Widget */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-full border-none shadow-xl bg-gradient-to-r from-zinc-900 to-black text-white rounded-2xl overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none" />
                    <CardContent className="p-8 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5 backdrop-blur-md">
                                <Video className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-widest">Video Center</h3>
                                <p className="text-zinc-400 text-sm font-medium mt-1">Start a secure, encrypted meeting with your team or clients in one click.</p>
                            </div>
                        </div>
                        <Link href="/admin/meetings">
                            <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-widest text-xs">
                                Launch Meetings Room
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {/* Order Status Breakdown */}
            {stats.statusBreakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Order Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={stats.statusBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="status" className="text-xs" />
                                <YAxis className="text-xs" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                                />
                                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function KpiCard({ title, value, icon, subtext, trend }: {
    title: string,
    value: string,
    icon: any,
    subtext: string,
    trend?: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
                {trend && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">{trend}</p>
                )}
            </CardContent>
        </Card>
    );
}
