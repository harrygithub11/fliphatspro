'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    DollarSign, Users, TrendingUp, Package, Target, ShoppingCart,
    Activity, Bell, ArrowRight, Zap, CreditCard, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import TaskDrawer from '@/components/admin/TaskDrawer';

export default function Dashboard() {
    const [stats, setStats] = useState({
        revenue: 0,
        totalLeads: 0,
        pendingOnboarding: 0,
        chartData: [],
        activity: [],
        pipelineValue: 0,
        activeDeals: 0,
        leadsToday: 0
    });
    const [loading, setLoading] = useState(true);

    // Deep Linking: Task Drawer States
    const searchParams = useSearchParams();
    const router = useRouter();
    const taskIdString = searchParams.get('taskId');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
    const [team, setTeam] = useState([]);
    const [customers, setCustomers] = useState([]);

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

        async function fetchMetadata() {
            try {
                const [teamRes, leadsRes] = await Promise.all([
                    fetch('/api/admin/team'),
                    fetch('/api/admin/leads')
                ]);
                const teamData = await teamRes.json();
                const leadsData = await leadsRes.json();

                if (teamData.success) setTeam(teamData.users || []);
                if (leadsData.success) setCustomers(leadsData.data?.profile ? [leadsData.data.profile] : leadsData.data || []);
            } catch (e) {
                console.error("Failed to fetch dashboard metadata", e);
            }
        }

        fetchStats();
        fetchMetadata();
    }, []);

    // Handle Task Deep Linking
    useEffect(() => {
        if (taskIdString) {
            const taskId = parseInt(taskIdString);
            if (!isNaN(taskId)) {
                // Fetch basic task info to open drawer (drawer will fetch full details)
                fetch(`/api/admin/tasks/${taskId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setSelectedTask(data.task);
                            setIsTaskDrawerOpen(true);
                        }
                    })
                    .catch(err => console.error("Failed to fetch task for deep link", err));
            }
        }
    }, [taskIdString]);

    const closeTaskDrawer = () => {
        setIsTaskDrawerOpen(false);
        // Remove taskId from URL without refreshing
        const params = new URLSearchParams(searchParams.toString());
        params.delete('taskId');
        router.push(window.location.pathname + (params.toString() ? `?${params.toString()}` : ''), { scroll: false });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px] w-full">
                <div className="flex flex-col items-center animate-pulse">
                    <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl mb-4" />
                    <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Welcome Banner */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-black/5 dark:ring-white/10 group">
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-800 to-black sm:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] sm:from-[#FF5941] sm:via-zinc-900 sm:to-black transition-all duration-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>

                <div className="relative z-10 p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md shadow-inner">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5941] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5941]"></span>
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-white/90 uppercase">System Active</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                            Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5941] to-orange-200">Center</span>
                        </h1>
                        <p className="text-zinc-300 text-sm sm:text-base font-medium leading-relaxed">
                            Overview of your performance, pipeline, and active tasks. You have <span className="text-white font-bold">{stats.leadsToday} new leads</span> waiting for action today.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button className="bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12 px-6 shadow-xl shadow-black/20">
                            View Reports
                        </Button>
                        <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 rounded-xl h-12 px-6 backdrop-blur-sm transition-colors shadow-none">
                            Manage Leads
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <PremiumStatCard
                    title="Total Revenue"
                    value={`₹${Number(stats.revenue).toLocaleString()}`}
                    trend="+12.5%"
                    trendUp={true}
                    icon={DollarSign}
                    color="emerald"
                    data={[40, 35, 50, 45, 60, 55, 75]}
                />
                <PremiumStatCard
                    title="Active Leads"
                    value={stats.totalLeads.toString()}
                    trend={`+${stats.leadsToday} today`}
                    trendUp={true}
                    icon={Users}
                    color="blue"
                    data={[10, 15, 12, 20, 18, 25, 30]}
                />
                <PremiumStatCard
                    title="Pipeline Value"
                    value={`₹${Number(stats.pipelineValue).toLocaleString()}`}
                    trend={`${stats.activeDeals} deals`}
                    trendUp={true}
                    icon={Target}
                    color="orange"
                    data={[60, 55, 65, 60, 70, 65, 80]}
                />
                <PremiumStatCard
                    title="Pending Orders"
                    value={stats.pendingOnboarding.toString()}
                    trend="Needs attention"
                    trendUp={false}
                    icon={Package}
                    color="red"
                    data={[5, 8, 4, 10, 6, 8, 12]}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                {/* Chart Section */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Revenue Analytics</h3>
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Income over last 30 days</p>
                            </div>
                            <select className="bg-zinc-50 dark:bg-zinc-800 border-none text-sm font-semibold rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer">
                                <option>Last 7 Days</option>
                                <option>Last 30 Days</option>
                                <option>This Year</option>
                            </select>
                        </div>

                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FF5941" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#FF5941" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 500 }}
                                        dy={10}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#9CA3AF', fontWeight: 500 }}
                                        tickFormatter={(value) => `₹${value / 1000}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                        }}
                                        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#FF5941"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#FF5941' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <ActionButton icon={Zap} title="Quick Lead" desc="Add new prospect" color="bg-indigo-500" />
                        <ActionButton icon={CreditCard} title="Create Invoice" desc="Send payment link" color="bg-zinc-800" />
                        <ActionButton icon={Bell} title="Broadcast" desc="Send notification" color="bg-[#FF5941]" />
                    </div>
                </div>

                {/* Right Column: Activity & Mini Stats */}
                <div className="space-y-6">
                    {/* Activity Feed */}
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm backdrop-blur-sm h-full max-h-[600px] flex flex-col">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Live Feed</h3>
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-[#FF5941] hover:bg-[#FF5941]/10 h-8">View All</Button>
                        </div>

                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                            {stats.activity.length === 0 ? (
                                <div className="text-center py-10 text-zinc-400 text-sm">No recent activity found.</div>
                            ) : (
                                stats.activity.map((item: any, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="relative mt-1">
                                            <div className={cn(
                                                "h-10 w-10 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-10 relative bg-zinc-50 dark:bg-zinc-800 transition-colors",
                                                item.status === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                    item.status === 'processing' ? "bg-blue-50 text-blue-600" : "bg-zinc-50 text-zinc-500"
                                            )}>
                                                {item.status === 'paid' ? <DollarSign className="w-4 h-4" /> :
                                                    item.status === 'processing' ? <Activity className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </div>
                                            {i !== stats.activity.length - 1 && (
                                                <div className="absolute top-10 left-1/2 -ml-px w-0.5 h-full bg-zinc-100 dark:bg-zinc-800 -z-0"></div>
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4 border-b border-zinc-50 dark:border-zinc-800/50">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">{item.customer_name || 'Guest'}</p>
                                                <span className="text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-full">
                                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-0.5 font-medium leading-relaxed">
                                                {item.status === 'paid'
                                                    ? <span className="text-emerald-600">Successfully paid <span className="font-bold">₹{Number(item.amount).toLocaleString()}</span></span>
                                                    : `Order status updated to ${item.status}`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Deep Linked Task Drawer */}
            <TaskDrawer
                task={selectedTask}
                isOpen={isTaskDrawerOpen}
                onClose={closeTaskDrawer}
                team={team}
                customers={customers}
                onUpdate={() => { }} // No local list to update
                onAddComment={() => { }}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------------

function PremiumStatCard({ title, value, trend, trendUp, icon: Icon, color, data }: any) {
    const colors: any = {
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', icon: 'bg-emerald-500' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', icon: 'bg-blue-500' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: 'bg-orange-500' },
        red: { bg: 'bg-red-500/10', text: 'text-red-600', icon: 'bg-red-500' },
    };

    const c = colors[color] || colors.blue;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 group backdrop-blur-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
                    <p className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{value}</p>
                </div>
                <div className={cn("size-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-black/5 transition-transform group-hover:scale-110 duration-300", c.icon)}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className={cn("px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1", trendUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400")}>
                    {trendUp ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                    {trend}
                </div>
                <span className="text-[10px] font-bold text-zinc-300 dark:text-zinc-600 uppercase tracking-wider ml-auto">Last 30d</span>
            </div>

            {/* Decorative mini-chart background */}
            <div className="absolute -bottom-4 -right-4 w-32 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="flex items-end justify-between h-full gap-1">
                    {data.map((h: number, i: number) => (
                        <div key={i} className={cn("w-full rounded-t-sm", c.icon)} style={{ height: `${h}%` }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, title, desc, color }: any) {
    return (
        <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className={cn("size-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3 transition-transform group-hover:scale-110 duration-300", color)}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-0.5">{title}</span>
            <span className="text-[10px] font-medium text-zinc-400">{desc}</span>
        </button>
    );
}
