
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Shield, Calendar, Clock, Lock, Key, RefreshCw, MessageSquare, Check, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function ManageUserPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [roles, setRoles] = useState<any[]>([]); // Dynamic roles state
    const [loginHistory, setLoginHistory] = useState<any[]>([]);
    const [activityLogs, setActivityLogs] = useState<any[]>([]); // Dynamic Activity Logs

    // Success Dialog State
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [savedPassword, setSavedPassword] = useState('');

    useEffect(() => {
        if (params.id) {
            fetchUserDetails();
            fetchLogs('login');
            fetchLogs('all');
            fetchRoles(); // Fetch roles on mount
        }
    }, [params.id]);

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            if (data.success) {
                setRoles(data.roles);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchLogs = async (type: 'login' | 'all') => {
        try {
            const res = await fetch(`/api/admin/team/${params.id}/activity?type=${type}`);
            const data = await res.json();
            if (data.success) {
                if (type === 'login') setLoginHistory(data.logs);
                else setActivityLogs(data.logs);
            }
        } catch (error) {
            console.error(`Error fetching ${type} logs:`, error);
        }
    };

    const fetchUserDetails = async () => {
        try {
            const res = await fetch(`/api/admin/team/${params.id}`);
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                setSelectedRole(data.user.role);
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive"
                });
                router.push('/team');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        } finally {
            setLoading(false);
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

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 8) {
            toast({ title: "Invalid Password", description: "Password must be at least 8 characters", variant: "destructive" });
            return;
        }

        try {
            const res = await fetch(`/api/admin/team/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setSavedPassword(newPassword);
                setShowSuccessDialog(true);
                setNewPassword(''); // Clear input, but keep in savedPassword for dialog
            } else {
                toast({ title: "Error", description: data.message || "Failed to reset password", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(savedPassword);
        toast({ title: "Copied", description: "Password copied to clipboard" });
    };

    const handleRoleUpdate = async (newRole: string) => {
        const oldRole = selectedRole;
        setSelectedRole(newRole); // Optimistic update

        try {
            const res = await fetch(`/api/admin/team/${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();

            if (res.ok && data.success) {
                toast({ title: "Role Updated", description: `User role changed to ${newRole}`, className: "bg-green-500 text-white" });
            } else {
                setSelectedRole(oldRole); // Revert
                toast({ title: "Error", description: data.message || "Failed to update role", variant: "destructive" });
            }
        } catch (error) {
            setSelectedRole(oldRole); // Revert
            toast({ title: "Error", description: "Failed to connect to server", variant: "destructive" });
        }
    };

    const formatAction = (action: string) => {
        if (!action) return 'Unknown Action';
        return action
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div>
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" asChild>
                    <Link href="/team">
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Back
                    </Link>
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manage User</h1>
                        <p className="text-muted-foreground">View and manage team member details</p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl font-bold">
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.name ? user.name.charAt(0).toUpperCase() : 'U'
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    {user.name}
                                </h2>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                    <span>{user.email}</span>
                                    <Badge variant="default" className="bg-red-600 hover:bg-red-700">
                                        <Shield className="w-3 h-3 mr-1" />
                                        {user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Member'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                            <div className="flex items-center font-medium">
                                <Calendar className="w-4 h-4 mr-2 text-zinc-400" />
                                {new Date(user.joined_at).toLocaleDateString()}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Last Login</p>
                            <div className="flex items-center font-medium">
                                <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                                {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs & Settings */}
            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="w-auto bg-transparent p-0 border-b rounded-none h-auto space-x-6">
                    <TabsTrigger
                        value="settings"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-3 pt-0 font-medium"
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        Settings
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-3 pt-0 font-medium text-muted-foreground"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Login History
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-0 pb-3 pt-0 font-medium text-muted-foreground"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Activity Log
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="mt-8 space-y-8">
                    {/* Reset Password */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Reset Password</CardTitle>
                            <CardDescription>Set a new password for this user</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <div className="flex gap-2 max-w-xl">
                                    <Input
                                        type="text"
                                        placeholder="Enter new password (min 8 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Button variant="outline" onClick={generatePassword}>Generate</Button>
                                </div>
                            </div>
                            <Button className="bg-red-600 hover:bg-red-700" onClick={handlePasswordReset}>
                                <Key className="w-4 h-4 mr-2" />
                                Reset Password
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Change Role */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Role</CardTitle>
                            <CardDescription>Update user permissions and access level</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-xl">
                                <Select value={selectedRole} onValueChange={handleRoleUpdate}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name}>
                                                {role.name} {role.is_system ? '' : '(Custom)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Login History</CardTitle>
                            <CardDescription>Recent sign-in activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loginHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {loginHistory.map((log: any) => (
                                        <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                                                    <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Successful Login</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                <p>{log.ip_address || 'Unknown IP'}</p>
                                                <p>Web Client</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No login history found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>Actions performed by this user</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activityLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {activityLogs.map((log: any) => (
                                        <div key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm">{formatAction(log.action)}</p>
                                                    {log.customer_id && (
                                                        <Link href={`/leads/${log.customer_id}`} className="text-xs bg-muted px-2 py-0.5 rounded-full hover:bg-muted/80 transition-colors">
                                                            {log.customer_name || 'View Customer'} ↗
                                                        </Link>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                            <div className="text-right text-xs text-muted-foreground">
                                                <p className="max-w-[150px] truncate" title={log.content}>{log.content || 'No details'}</p>
                                                {/* IP Not tracked in interactions table yet */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    No activity logs found.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600">
                            <Check className="h-5 w-5" />
                            Password Reset Successful
                        </DialogTitle>
                        <DialogDescription>
                            The password for <strong>{user.name}</strong> has been updated.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <Label className="text-xs text-muted-foreground">New Password</Label>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 font-mono text-sm bg-background p-2 rounded border">
                                {savedPassword}
                            </code>
                            <Button size="icon" variant="outline" onClick={copyToClipboard} title="Copy to clipboard">
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setShowSuccessDialog(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
