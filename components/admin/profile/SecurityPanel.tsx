'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ShieldAlert, ShieldCheck, LogOut } from 'lucide-react';

export function SecurityPanel() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast({ variant: 'destructive', description: 'Please fill in all password fields' });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast({ variant: 'destructive', description: 'New passwords do not match' });
            return;
        }

        if (newPassword.length < 8) {
            toast({ variant: 'destructive', description: 'New password must be at least 8 characters' });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/admin/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();

            if (data.success) {
                toast({ description: "Password changed successfully. All other sessions have been revoked.", className: "bg-green-500 text-white" });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast({ variant: 'destructive', description: data.message || 'Failed to change password' });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast({ variant: 'destructive', description: 'Failed to change password' });
        } finally {
            setLoading(false);
        }
    };

    const [sessions, setSessions] = useState<any[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/admin/profile/sessions');
            const data = await res.json();
            if (data.success) {
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        } finally {
            setLoadingSessions(false);
        }
    };

    // Load sessions on mount
    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string, isAll: boolean = false) => {
        try {
            const url = isAll
                ? '/api/admin/profile/sessions?all=true'
                : `/api/admin/profile/sessions?id=${sessionId}`;

            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) {
                toast({
                    description: isAll ? "All other sessions logged out" : "Session revoked",
                    className: "bg-green-500 text-white"
                });
                fetchSessions();
            } else {
                toast({ variant: 'destructive', description: "Failed to revoke session" });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: "Error revoking session" });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-l-4 border-l-orange-500">
                <CardHeader>
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                        <ShieldAlert className="h-5 w-5" />
                        <span className="font-bold text-sm uppercase tracking-wider">Security Zone</span>
                    </div>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure. Changing your password will log out all other active sessions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-w-lg">
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
                    <Button onClick={handlePasswordChange} disabled={loading} className="w-full sm:w-auto">
                        {loading ? 'Updating Security...' : 'Update Password'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Manage devices currently logged into your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loadingSessions ? (
                            <div className="text-center py-4 text-muted-foreground">Loading sessions...</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                No active sessions found. (You might need to re-login to see this device)
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className={`h-8 w-8 ${session.is_current ? 'text-green-500' : 'text-zinc-400'}`} />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {session.user_agent ? (
                                                    session.user_agent.includes('Mozilla') ? 'Web Browser' : session.user_agent
                                                ) : 'Unknown Device'}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-x-2">
                                                <span>{new Date(session.last_active).toLocaleString()}</span>
                                                <span>•</span>
                                                <span>{session.ip_address || 'Unknown IP'}</span>
                                                {session.is_current && <span className="text-green-600 font-medium">• This Device</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {session.is_current ? (
                                        <Button variant="outline" size="sm" disabled className="ml-2">
                                            Active
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="ml-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                            onClick={() => handleRevokeSession(session.id)}
                                        >
                                            Log Out
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleRevokeSession('', true)}
                            disabled={sessions.length <= 1}
                        >
                            <LogOut className="h-4 w-4 mr-2" /> Log Out All Other Devices
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
