'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Activity, AlertCircle } from 'lucide-react';
import BookingsPage from './bookings/page';

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            }
        };
        fetchStats();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats ? formatCurrency(stats.revenue) : '...'}</div>
                        <p className="text-xs text-muted-foreground">
                            Across all offers
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats ? stats.totalLeads : '...'}</div>
                        <p className="text-xs text-muted-foreground">
                            Registered customers
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Onboarding</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats ? stats.pendingOnboarding : '...'}</div>
                        <p className="text-xs text-muted-foreground">
                            Paid but form not submitted
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Payment Issues</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats ? stats.issues : '...'}</div>
                        <p className="text-xs text-muted-foreground">
                            Failed transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Source Breakdown */}
            {stats?.sourceBreakdown && (
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="bg-gradient-to-br from-red-50 to-white border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-700">New Year Offer (5k)</CardTitle>
                            <CardDescription>Performance of /newyearonly page</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Revenue</span>
                                <span className="text-xl font-bold text-red-600">
                                    {formatCurrency(stats.sourceBreakdown.find((s: any) => s.source === 'newyear_5k')?.revenue || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Orders</span>
                                <span className="text-lg font-bold">
                                    {stats.sourceBreakdown.find((s: any) => s.source === 'newyear_5k')?.count || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                        <CardHeader>
                            <CardTitle className="text-purple-700">Lifetime Offer (12k)</CardTitle>
                            <CardDescription>Performance of /lifetimeoffer page</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Revenue</span>
                                <span className="text-xl font-bold text-purple-600">
                                    {formatCurrency(stats.sourceBreakdown.find((s: any) => s.source === 'lifetime_12k')?.revenue || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Orders</span>
                                <span className="text-lg font-bold">
                                    {stats.sourceBreakdown.find((s: any) => s.source === 'lifetime_12k')?.count || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <BookingsPage />
        </div>
    );
}
