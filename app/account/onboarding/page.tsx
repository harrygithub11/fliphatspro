'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, ArrowRight, Plus, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [inviteCode, setInviteCode] = useState('');

    const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name');

        try {
            const res = await fetch('/api/admin/tenants/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                const data = await res.json();
                // Redirect to Subscription Selection (Step 3)
                window.location.href = '/onboarding/subscription';
            } else {
                alert('Failed to create company');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating company');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinCompany = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/team/accept-invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: inviteCode }),
            });

            if (res.ok) {
                window.location.href = '/onboarding/subscription';
            } else {
                const err = await res.json();
                alert(err.error || 'Invalid or expired invitation');
            }
        } catch (error) {
            console.error(error);
            alert('Error joining company');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">

                {/* Left Side: Context */}
                <div className="space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                        <Building2 className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                        Welcome to FlipHats Pro
                    </h1>
                    <p className="text-lg text-gray-600">
                        To get started, you need to be associated with a company workspace.
                        You can create a new organization or join an existing one using an invite code.
                    </p>
                    <div className="pt-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold uppercase tracking-wide">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            Action Required
                        </div>
                    </div>
                </div>

                {/* Right Side: Action Cards */}
                <div className="w-full max-w-md mx-auto">
                    <Tabs defaultValue="create" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="create">Create Company</TabsTrigger>
                            <TabsTrigger value="join">Join Company</TabsTrigger>
                        </TabsList>

                        <TabsContent value="create">
                            <Card className="shadow-xl border-t-4 border-t-primary">
                                <CardHeader>
                                    <CardTitle>Create New Workspace</CardTitle>
                                    <CardDescription>Start a new organization and become the owner.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleCreateCompany}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Company Name</Label>
                                            <Input id="name" name="name" placeholder="Acme Inc." required />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-4">
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Creating...' : 'Create Workspace'} <Plus className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>

                        <TabsContent value="join">
                            <Card className="shadow-xl border-t-4 border-t-secondary">
                                <CardHeader>
                                    <CardTitle>Join Existing Workspace</CardTitle>
                                    <CardDescription>Enter the invitation code sent to your email.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleJoinCompany}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="code">Invitation Code</Label>
                                            <Input
                                                id="code"
                                                placeholder="INV-..."
                                                value={inviteCode}
                                                onChange={(e) => setInviteCode(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-4">
                                        <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Verifying...' : 'Join Workspace'} <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-8 text-center">
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                            <LogOut className="h-4 w-4 mr-2" /> Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
