'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Building, Activity, ShieldCheck, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MasterDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        systemHealth: 'Healthy',
        revenueTrend: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/master/stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch master stats', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading Platform Data...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
                <p className="text-zinc-400">Real-time insights across the entire ecosystem.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Total Revenue"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                    subtext="Gross Platform Volume"
                />
                <KpiCard
                    title="Active Tenants"
                    value={`${stats.activeTenants} / ${stats.totalTenants}`}
                    icon={<Building className="h-4 w-4 text-blue-500" />}
                    subtext="Workspaces Online"
                />
                <KpiCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={<Users className="h-4 w-4 text-purple-500" />}
                    subtext="Verified Accounts"
                />
                <KpiCard
                    title="System Health"
                    value={stats.systemHealth}
                    icon={<Activity className="h-4 w-4 text-green-500" />}
                    subtext="All Systems Operational"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Revenue Chart */}
                <Card className="col-span-4 bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle>Platform Growth</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full mt-4 bg-zinc-900/50 rounded-lg flex items-center justify-center border border-zinc-800 border-dashed text-zinc-600 font-mono text-sm">
                            CHART DATA COMING SOON
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card className="col-span-3 bg-zinc-900 border-zinc-800 text-white">
                    <CardHeader>
                        <CardTitle>Infrastructure Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <StatusItem label="Database Cluster" status="Operational" />
                            <StatusItem label="API Gateway" status="Operational" />
                            <StatusItem label="Email Service" status="Operational" />
                            <StatusItem label="Storage (S3)" status="Operational" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function KpiCard({ title, value, icon, subtext }: { title: string, value: string, icon: any, subtext: string }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-zinc-500 mt-1">{subtext}</p>
            </CardContent>
        </Card>
    );
}

function StatusItem({ label, status }: { label: string, status: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-500 font-medium">{status}</span>
            </div>
        </div>
    );
}
