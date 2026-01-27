'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Save, ArrowLeft, Lock } from 'lucide-react';

interface RoleFormProps {
    initialData?: any;
    isSystem?: boolean;
}

const RESOURCES = [
    { id: 'contacts', label: 'Contacts', scopes: true },
    { id: 'leads', label: 'Leads', scopes: true },
    { id: 'deals', label: 'Deals/Opportunities', scopes: true },
    { id: 'team', label: 'Team Management', scopes: false },
    { id: 'settings', label: 'Settings', scopes: false },
];

const SCOPES = [
    { value: 'all', label: 'All Records' },
    { value: 'team', label: 'Team Only' },
    { value: 'owned', label: 'Owned Only' },
    { value: 'none', label: 'None' },
];

export default function RoleForm({ initialData, isSystem }: RoleFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');

    // Default Permissions Structure
    const defaultPermissions = {
        contacts: { view: 'team', edit: 'owned', delete: false, export: false },
        leads: { view: 'team', edit: 'owned', delete: false, export: false },
        deals: { view: 'team', edit: 'owned', delete: false },
        team: { manage: false, invite: false },
        settings: { billing: false, system: false }
    };

    const [permissions, setPermissions] = useState(initialData?.permissions || defaultPermissions);

    const handleSave = async () => {
        if (!name.trim()) {
            toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            const url = initialData ? `/api/admin/roles/${initialData.id}` : '/api/admin/roles';
            const method = initialData ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, permissions }),
            });

            const data = await res.json();

            if (data.success) {
                toast({ title: 'Success', description: `Role ${initialData ? 'updated' : 'created'} successfully`, className: 'bg-green-500 text-white' });
                router.push('/admin/roles');
            } else {
                toast({ title: 'Error', description: data.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save role', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const updatePermission = (resource: string, action: string, value: any) => {
        setPermissions((prev: any) => ({
            ...prev,
            [resource]: {
                ...prev[resource],
                [action]: value
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Roles
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Role'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* General Info */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Role Details</CardTitle>
                        <CardDescription>Basic information about this role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Role Name</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Sales Associate"
                                disabled={isSystem} // System names are locked
                            />
                            {isSystem && <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> System role names cannot be changed.</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe what this role is for..."
                                className="min-h-[100px]"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Permission Matrix */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Permissions</CardTitle>
                        <CardDescription>Configure access levels for each resource.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="contacts" className="w-full">
                            <TabsList className="w-full justify-start h-auto flex-wrap mb-4">
                                {RESOURCES.map(res => (
                                    <TabsTrigger key={res.id} value={res.id} className="min-w-[80px]">
                                        {res.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {RESOURCES.map(res => (
                                <TabsContent key={res.id} value={res.id} className="space-y-6">
                                    <div className="bg-muted/30 p-4 rounded-lg border">
                                        <h3 className="font-medium mb-4 text-lg border-b pb-2">{res.label} Access</h3>

                                        {res.scopes ? (
                                            <div className="space-y-6">
                                                {/* Scoped Permissions (View/Edit) */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>View Access</Label>
                                                        <Select
                                                            value={permissions[res.id]?.view || 'none'}
                                                            onValueChange={(val) => updatePermission(res.id, 'view', val)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {SCOPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">Which records can they see?</p>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Edit Access</Label>
                                                        <Select
                                                            value={permissions[res.id]?.edit || 'none'}
                                                            onValueChange={(val) => updatePermission(res.id, 'edit', val)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {SCOPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">Which records can they modify?</p>
                                                    </div>
                                                </div>

                                                {/* Boolean Permissions */}
                                                <div className="space-y-3 pt-2">
                                                    <div className="flex items-center justify-between border-t pt-3">
                                                        <div className="space-y-0.5">
                                                            <Label>Delete Records</Label>
                                                            <p className="text-xs text-muted-foreground">Can permanently delete {res.label.toLowerCase()}.</p>
                                                        </div>
                                                        <Switch
                                                            checked={permissions[res.id]?.delete === 'all' || permissions[res.id]?.delete === true}
                                                            onCheckedChange={(checked) => updatePermission(res.id, 'delete', checked ? 'all' : false)}
                                                        />
                                                    </div>

                                                    {permissions[res.id]?.export !== undefined && (
                                                        <div className="flex items-center justify-between border-t pt-3">
                                                            <div className="space-y-0.5">
                                                                <Label>Export Data</Label>
                                                                <p className="text-xs text-muted-foreground">Can export {res.label.toLowerCase()} to CSV/Excel.</p>
                                                            </div>
                                                            <Switch
                                                                checked={permissions[res.id]?.export || false}
                                                                onCheckedChange={(checked) => updatePermission(res.id, 'export', checked)}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Non-Scoped (Boolean) Permissions */
                                            <div className="space-y-4">
                                                {Object.keys(permissions[res.id] || {}).map(key => (
                                                    <div key={key} className="flex items-center justify-between border-b pb-3 last:border-0">
                                                        <div className="space-y-0.5">
                                                            <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                                                            <p className="text-xs text-muted-foreground">
                                                                Enable {key} Capability for {res.label}.
                                                            </p>
                                                        </div>
                                                        <Switch
                                                            checked={permissions[res.id][key] || false}
                                                            onCheckedChange={(checked) => updatePermission(res.id, key, checked)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
