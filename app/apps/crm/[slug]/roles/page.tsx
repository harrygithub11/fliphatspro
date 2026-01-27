'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Users, Lock, MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RolesPage() {
    const { toast } = useToast();
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleToDelete, setRoleToDelete] = useState<any>(null);
    const router = useRouter(); // Create router instance

    useEffect(() => {
        const checkAccess = async () => {
            try {
                const res = await fetch('/api/admin/me');
                const data = await res.json();

                if (data.success && data.admin) {
                    const permissions = data.admin.permissions || {};
                    // Strict Check: Must have team.manage permission
                    if (!permissions.team?.manage) {
                        toast({
                            title: 'Access Denied',
                            description: 'You do not have permission to manage roles.',
                            variant: 'destructive'
                        });
                        router.push('/dashboard');
                        return;
                    }
                }

                // If authorized, load roles
                fetchRoles();
            } catch (error) {
                console.error('Auth Check Failed', error);
            }
        };

        checkAccess();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch('/api/admin/roles');
            const data = await res.json();
            if (data.success) {
                setRoles(data.roles);
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
            toast({ title: 'Error', description: 'Failed to load roles', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!roleToDelete) return;

        try {
            const res = await fetch(`/api/admin/roles/${roleToDelete.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();

            if (data.success) {
                toast({ title: 'Success', description: 'Role deleted successfully', className: 'bg-green-500 text-white' });
                fetchRoles();
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' });
        } finally {
            setRoleToDelete(null);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading roles...</div>;
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage access levels and permissions for your team members.
                    </p>
                </div>
                <Link href="/roles/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Role
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roles.map((role) => (
                    <Card key={role.id} className="relative hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl">{role.name}</CardTitle>
                                        {role.is_system && (
                                            <Badge variant="secondary" className="gap-1 px-2 py-0 h-6">
                                                <Lock className="h-3 w-3" /> System
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription className="line-clamp-2 min-h-[40px]">
                                        {role.description || 'No description provided.'}
                                    </CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mr-3 -mt-3">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/roles/${role.id}`} className="flex items-center gap-2 cursor-pointer">
                                                <Edit className="h-4 w-4" /> Edit Permissions
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem disabled className="flex items-center gap-2 cursor-pointer">
                                            <Copy className="h-4 w-4" /> Duplicate (Coming Soon)
                                        </DropdownMenuItem>
                                        {!role.is_system && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                                                    onClick={() => setRoleToDelete(role)}
                                                >
                                                    <Trash2 className="h-4 w-4" /> Delete Role
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
                                <Users className="h-4 w-4" />
                                <span>{role.user_count || 0} active members</span>
                            </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                            <Link href={`/roles/${role.id}`} className="w-full">
                                <Button variant="outline" className="w-full">
                                    {role.is_system ? 'View Permissions' : 'Configure Role'}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the <strong>{roleToDelete?.name}</strong> role.
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Delete Role
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
