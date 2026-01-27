'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function CreateWorkspacePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
    });

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);

        setFormData({ name, slug });
    };

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a workspace name',
                variant: 'destructive',
            });
            return;
        }

        setCreating(true);

        try {
            const response = await fetch('/api/admin/tenants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                toast({
                    title: 'Success!',
                    description: 'Workspace created successfully',
                });

                // Switch to the new workspace
                await fetch('/api/admin/tenants/switch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tenantId: data.tenant.id }),
                });

                router.push('/dashboard');
                router.refresh();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create workspace');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to create workspace',
                variant: 'destructive',
            });
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 mb-4">
                        <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Create New Workspace</h1>
                    <p className="text-muted-foreground">Set up a new workspace for your team or project</p>
                </div>

                {/* Form */}
                <form onSubmit={handleCreate} className="space-y-6">
                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Workspace Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Acme Corp"
                                autoFocus
                            />
                        </div>

                        {/* Slug */}
                        <div className="space-y-2">
                            <Label htmlFor="slug">Workspace URL</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">fliphats.com/app/</span>
                                <Input
                                    id="slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                                    placeholder="acme-corp"
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Plan Info */}
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-sm font-medium">Free Plan</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Start with the free plan. Upgrade anytime to unlock more features.
                            </p>
                        </div>
                    </div>

                    {/* Submit */}
                    <Button type="submit" className="w-full" size="lg" disabled={creating}>
                        {creating ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Workspace...
                            </>
                        ) : (
                            <>
                                <Building2 className="w-4 h-4 mr-2" />
                                Create Workspace
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
