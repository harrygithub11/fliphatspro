'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Mail, Shield, Trash2, Eye } from 'lucide-react';

interface TeamMember {
    id: number;
    email: string;
    name: string;
    role: string;
    avatar_url?: string;
    created_at: string;
    last_login: string | null;
}

export default function TeamManagementPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [roles, setRoles] = useState<any[]>([]); // Dynamic roles state
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'support'
    });

    useEffect(() => {
        fetchTeamMembers();
        fetchRoles(); // Fetch roles on mount
    }, []);

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

    const fetchTeamMembers = async () => {
        try {
            const res = await fetch('/api/admin/team');
            const data = await res.json();
            if (Array.isArray(data)) {
                setTeamMembers(data);
            }
        } catch (error) {
            console.error('Error fetching team members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async () => {
        if (!formData.email || !formData.name || !formData.password) {
            alert('Please fill in all fields');
            return;
        }

        try {
            const res = await fetch('/api/admin/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (data.success) {
                alert(`User created successfully!\n\nEmail: ${formData.email}\nPassword: ${formData.password}\n\nShare these credentials with the new team member.`);
                setIsDialogOpen(false);
                setFormData({ email: '', name: '', password: '', role: 'support' });
                fetchTeamMembers();
            } else {
                alert(data.message || 'Failed to create user');
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            alert('Client Error: ' + (error.message || 'Unknown error'));
        }
    };

    const handleDeleteUser = async (id: number, email: string) => {
        if (!confirm(`Are you sure you want to delete ${email}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/team/${id}`, {
                method: 'DELETE'
            });

            const data = await res.json();

            if (data.success) {
                alert('User deleted successfully');
                fetchTeamMembers();
            } else {
                alert(data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading team members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">Manage your team members and their access</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Team Member
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Last Login</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {teamMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold overflow-hidden">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'
                                                )}
                                            </div>
                                            {member.name || 'Unknown'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            {member.email}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.role === 'owner' ? 'default' : member.role === 'admin' ? 'secondary' : 'outline'}>
                                            <Shield className="h-3 w-3 mr-1" />
                                            {member.role === 'owner' ? 'Owner' :
                                                member.role === 'admin' ? 'Admin' :
                                                    member.role === 'member' ? 'Member' : 'Viewer'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(member.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/team/${member.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Eye className="h-4 w-4 text-zinc-500" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteUser(member.id, member.email)}
                                                disabled={member.role === 'owner'}
                                                title={member.role === 'owner' ? "Cannot delete the Owner" : "Delete user"}
                                            >
                                                <Trash2 className={`h-4 w-4 ${member.role === 'owner' ? 'text-zinc-300' : 'text-red-500'}`} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Team Member</DialogTitle>
                        <DialogDescription>
                            Create a new user account for your team. They'll be able to access this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john@fliphats.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="password"
                                    type="text"
                                    placeholder="Enter password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <Button type="button" variant="outline" onClick={generatePassword}>
                                    Generate
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Password will be hashed securely. Share it with the new user.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
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
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
