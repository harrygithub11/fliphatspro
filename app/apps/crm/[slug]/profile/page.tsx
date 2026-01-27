'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Lock, History, Activity, Shield, Calendar, MapPin, Sliders } from 'lucide-react';
import { ProfileInfoForm } from '@/components/admin/profile/ProfileInfoForm';
import { SecurityPanel } from '@/components/admin/profile/SecurityPanel';
// import { PreferencesForm } from '@/components/admin/profile/PreferencesForm';
import { toast } from '@/hooks/use-toast';

interface AdminProfile {
    id: number;
    email: string;
    name: string;
    role: string;
    phone?: string;
    avatar_url?: string;
    timezone?: string;
    language?: string;
    created_at: string;
    last_login: string | null;
    preferences: {
        theme: string;
        notify_email: boolean;
        notify_in_app: boolean;
        default_view: string;
    };
}

interface LoginLog {
    id: number;
    ip_address: string;
    user_agent: string;
    login_time: string;
    success: boolean;
}

interface ActivityLog {
    id: number;
    action_type: string;
    action_description: string;
    entity_type: string | null;
    entity_id: number | null;
    created_at: string;
}

function ProfileContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info');

    useEffect(() => {
        fetchProfile();
        fetchLoginLogs();
        fetchActivityLogs();
    }, []);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        router.push(`/profile?tab=${value}`, { scroll: false });
    };

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/admin/profile', { cache: 'no-store' });
            const data = await res.json();
            if (data.success) {
                setProfile(data.user);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast({ variant: 'destructive', description: "Failed to load profile" });
        } finally {
            setLoading(false);
        }
    };

    const fetchLoginLogs = async () => {
        try {
            const res = await fetch('/api/admin/profile/login-logs');
            const data = await res.json();
            if (Array.isArray(data)) {
                setLoginLogs(data);
            }
        } catch (error) {
            console.error('Error fetching login logs:', error);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const res = await fetch('/api/admin/profile/activity-logs');
            const data = await res.json();
            if (Array.isArray(data)) {
                setActivityLogs(data);
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
        }
    };

    const handleUpdateProfile = async (updates: any) => {
        const res = await fetch('/api/admin/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        const data = await res.json();
        if (data.success) {
            fetchProfile(); // Reload to get consistent state
        } else {
            throw new Error(data.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <Spinner />
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8 text-center text-muted-foreground">Profile not found. Please log in again.</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <p className="text-muted-foreground">Manage your profile, security, and preferences.</p>
            </div>

            {/* Profile Header Card */}
            <Card className="bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-200 dark:border-zinc-800">
                <CardHeader>
                    <div className="flex items-start md:items-center gap-6 flex-col md:flex-row">
                        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'A'
                            )}
                        </div>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-2xl">{profile.name || 'Admin User'}</CardTitle>
                                <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'} className="rounded-full">
                                    {profile.role ? profile.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Support Agent'}
                                </Badge>
                            </div>
                            <CardDescription className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {profile.email}
                                </span>
                                <span className="flex items-center gap-1.5 md:border-l md:pl-6 md:border-zinc-200 md:dark:border-zinc-700">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Member since {new Date(profile.created_at).toLocaleDateString()}
                                </span>
                                {profile.last_login && (
                                    <span className="flex items-center gap-1.5 md:border-l md:pl-6 md:border-zinc-200 md:dark:border-zinc-700">
                                        <History className="h-3.5 w-3.5" />
                                        Last login {new Date(profile.last_login).toLocaleString()}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl">
                    <TabsTrigger value="info" className="py-2.5 rounded-lg">
                        <User className="h-4 w-4 mr-2" /> Profile
                    </TabsTrigger>
                    {/* <TabsTrigger value="preferences" className="py-2.5 rounded-lg">
                        <Sliders className="h-4 w-4 mr-2" /> Preferences
                    </TabsTrigger> */}
                    <TabsTrigger value="security" className="py-2.5 rounded-lg">
                        <Lock className="h-4 w-4 mr-2" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="login-logs" className="py-2.5 rounded-lg">
                        <History className="h-4 w-4 mr-2" /> Logins
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="py-2.5 rounded-lg">
                        <Activity className="h-4 w-4 mr-2" /> Activity
                    </TabsTrigger>
                </TabsList>

                {/* Content Sections */}
                <TabsContent value="info" className="animate-in fade-in-50 duration-300">
                    <ProfileInfoForm user={profile} onUpdate={handleUpdateProfile} />
                </TabsContent>

                {/* <TabsContent value="preferences" className="animate-in fade-in-50 duration-300">
                    <PreferencesForm preferences={profile.preferences} onUpdate={handleUpdateProfile} />
                </TabsContent> */}

                <TabsContent value="security" className="animate-in fade-in-50 duration-300">
                    <SecurityPanel />
                </TabsContent>

                <TabsContent value="login-logs" className="animate-in fade-in-50 duration-300">
                    {/* Reusing existing table logic, enhanced UI */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent login attempts to your account.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loginLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                                No login history available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loginLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{new Date(log.login_time).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {log.ip_address || 'Unknown'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={log.user_agent}>
                                                    {log.user_agent.split(')')[0] + ')' || 'Unknown Device'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={log.success ? 'outline' : 'destructive'} className={log.success ? "text-green-600 bg-green-50 border-green-200" : ""}>
                                                        {log.success ? 'Success' : 'Failed'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>Audit trail of your actions within the system.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-8">
                                {activityLogs.length === 0 ? (
                                    <p className="text-muted-foreground py-4">No activity recorded yet</p>
                                ) : (
                                    activityLogs.map((log) => (
                                        <div key={log.id} className="relative">
                                            {/* Timestamp Node */}
                                            <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-white bg-zinc-300 dark:border-zinc-950 dark:bg-zinc-700" />

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{log.action_description}</span>
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase">{log.action_type}</Badge>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Spinner() {
    return (
        <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile configuration...</p>
        </div>
    );
}

export default function AdminProfilePage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Spinner /></div>}>
            <ProfileContent />
        </Suspense>
    );
}
