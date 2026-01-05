'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Lock, History, Activity, Shield, Calendar, MapPin } from 'lucide-react';

interface AdminProfile {
    id: number;
    email: string;
    name: string;
    role: string;
    created_at: string;
    last_login: string | null;
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

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<AdminProfile | null>(null);
    const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordChanging, setPasswordChanging] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchLoginLogs();
        fetchActivityLogs();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/admin/me');
            const data = await res.json();
            if (data.success) {
                setProfile(data.admin);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
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

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            alert('New password must be at least 8 characters');
            return;
        }

        setPasswordChanging(true);

        try {
            const res = await fetch('/api/admin/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (data.success) {
                alert('Password changed successfully!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                alert(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert('Failed to change password');
        } finally {
            setPasswordChanging(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return <div className="p-8">Failed to load profile</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                <p className="text-muted-foreground">Manage your account settings and view your activity</p>
            </div>

            {/* Profile Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                            {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                        </div>
                        <div>
                            <CardTitle>{profile.name || 'Unknown'}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {profile.email}
                                </span>
                                <Badge variant={profile.role === 'super_admin' ? 'default' : 'secondary'}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {profile.role === 'super_admin' ? 'Super Admin' : 'Support'}
                                </Badge>
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Member Since</p>
                            <p className="font-medium flex items-center gap-1 mt-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(profile.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Last Login</p>
                            <p className="font-medium flex items-center gap-1 mt-1">
                                <History className="h-4 w-4" />
                                {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs for different sections */}
            <Tabs defaultValue="security" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="security">
                        <Lock className="h-4 w-4 mr-2" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="login-logs">
                        <History className="h-4 w-4 mr-2" />
                        Login History
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                        <Activity className="h-4 w-4 mr-2" />
                        Activity Log
                    </TabsTrigger>
                </TabsList>

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password (min 8 characters)"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            <Button onClick={handlePasswordChange} disabled={passwordChanging}>
                                {passwordChanging ? 'Changing...' : 'Change Password'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Login Logs Tab */}
                <TabsContent value="login-logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent login attempts to your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loginLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                No login history available
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        loginLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell>{new Date(log.login_time).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {log.ip_address || 'Unknown'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                                    {log.user_agent || 'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={log.success ? 'default' : 'destructive'}>
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

                {/* Activity Log Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>Your recent actions in the system</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activityLogs.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">No activity recorded yet</p>
                                ) : (
                                    activityLogs.map((log) => (
                                        <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{log.action_description}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {log.action_type}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </span>
                                                </div>
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
