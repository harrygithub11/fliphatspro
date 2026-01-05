'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="profile">Admin Profile</TabsTrigger>
                    <TabsTrigger value="billing">Billing & Keys</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Configuration</CardTitle>
                            <CardDescription>Manage global settings for your CRM.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>CRM Name</Label>
                                <Input defaultValue="FliphatMedia CRM" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@fliphatmedia.com" />
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Admin Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Current Email</Label>
                                <Input disabled defaultValue="admin@system.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label>New Password</Label>
                                <Input type="password" />
                            </div>
                            <Button variant="secondary">Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>API Keys</CardTitle>
                            <CardDescription className="text-red-500">Sensitive Information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Razorpay Key ID</Label>
                                <Input defaultValue="rzp_test_..." type="password" />
                            </div>
                            <Button variant="outline">Regenerate Keys</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
