'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, Lock, History, Activity, Shield, Calendar, MapPin, ArrowLeft, Key } from 'lucide-react';

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [loginLogs, setLoginLogs] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('');

    useEffect(() => {
        fetchUserDetails();
    }, [userId]);

    const fetchUserDetails = async () => {
        try {
            const [userRes, logsRes, activityRes] = await Promise.all([
                fetch(`/api/admin/team/${userId}`),
                fetch(`/api/admin/team/${userId}/login-logs`),
                fetch(`/api/admin/team/${userId}/activity-logs`)
            ]);

            const userData = await userRes.json();
            const logsData = await logsRes.json();
            const activityData = await activityRes.json();

            if (userData.success) {
                setUser(userData.user);
                setNewRole(userData.user.role);
            }
            if (Array.isArray(logsData)) setLoginLogs(logsData);
            if (Array.isArray(activityData)) setActivityLogs(activityData);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            alert('Password must be at least 8 characters');
            return;
        }

        if (!confirm(`Reset password for ${user.name}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/team/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword })
            });

            const data = await res.json();

            if (data.success) {
                alert(`Password reset successfully!\n\nNew password: ${newPassword}\n\nShare this with the user.`);
                setNewPassword('');
            } else {
                alert(data.message || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Failed to reset password');
        }
    };

    const handleUpdateRole = async () => {
        if (newRole === user.role) {
            alert('No changes to save');
            return;
        }

        if (!confirm(`Change ${user.name}'s role to ${newRole === 'super_admin' ? 'Super Admin' : 'Support'}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/team/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole })
            });

            const data = await res.json();

            if (data.success) {
                alert('Role updated successfully!');
                fetchUserDetails();
            } else {
                alert(data.message || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Failed to update role');
        }
    };

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(password);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading user details...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8">
                <p>User not found</p>
                <Button onClick={() => router.push('/admin/team')} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Team
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/admin/team')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage User</h1>
                    <p className="text-muted-foreground">View and manage team member details</p>
                </div>
            </div>

            {/* User Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                            {user.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : '??'}
                        </div>
                        <div>
                            <CardTitle>{user.name || 'Unknown'}</CardTitle>
                            <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {user.email}
                                </span>
                                <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                                    <Shield className="h-3 w-3 mr-1" />
                                    {user.role === 'super_admin' ? 'Super Admin' : 'Support'}
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
                                {user.created_at && !isNaN(new Date(user.created_at).getTime())
                                    ? new Date(user.created_at).toLocaleDateString()
                                    : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Last Login</p>
                            <p className="font-medium flex items-center gap-1 mt-1">
                                <History className="h-4 w-4" />
                                {user.last_login && !isNaN(new Date(user.last_login).getTime())
                                    ? new Date(user.last_login).toLocaleString()
                                    : 'Never'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Management Tabs */}
            <Tabs defaultValue="settings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="settings">
                        <Lock className="h-4 w-4 mr-2" />
                        Settings
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

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Set a new password for this user</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="new-password"
                                        type="text"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password (min 8 characters)"
                                    />
                                    <Button type="button" variant="outline" onClick={generatePassword}>
                                        Generate
                                    </Button>
                                </div>
                            </div>
                            <Button onClick={handleResetPassword}>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Role</CardTitle>
                            <CardDescription>Update user permissions and access level</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={newRole} onValueChange={setNewRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                                        <SelectItem value="support">Support (Limited Access)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleUpdateRole} disabled={newRole === user.role}>
                                <Shield className="h-4 w-4 mr-2" />
                                Update Role
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Login Logs Tab */}
                <TabsContent value="login-logs">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent login attempts for this user</CardDescription>
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
                            <CardDescription>Recent actions by this user</CardDescription>
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
