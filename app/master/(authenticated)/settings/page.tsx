'use client';

import { useState, useEffect } from 'react';
import { Save, ShieldAlert, Globe, Mail, Clock, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function SystemSettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        allow_registration: true,
        default_trial_days: '14',
        maintenance_mode: false,
        support_email: 'support@fliphats.com'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const res = await fetch('/api/master/settings');
            const data = await res.json();

            // Normalize types
            setSettings({
                allow_registration: data.allow_registration === 'true',
                default_trial_days: data.default_trial_days || '14',
                maintenance_mode: data.maintenance_mode === 'true',
                support_email: data.support_email || ''
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch('/api/master/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast({
                    title: 'Settings Saved',
                    description: 'Global system configuration updated.',
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Could not save settings.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading system config...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">System Settings</h1>
                    <p className="text-zinc-500">Configure global platform behavior and defaults.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Registration & Access */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-100">
                            <Globe className="w-5 h-5 text-blue-500" />
                            Registration & Access
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-zinc-200">Allow Self-Registration</Label>
                                <p className="text-sm text-zinc-500">
                                    If disabled, only admins can invite new tenants.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allow_registration}
                                onCheckedChange={(c) => setSettings(s => ({ ...s, allow_registration: c }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-200">Default Trial Period (Days)</Label>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-zinc-500" />
                                <Input
                                    value={settings.default_trial_days}
                                    onChange={(e) => setSettings(s => ({ ...s, default_trial_days: e.target.value }))}
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-zinc-100">
                            <ShieldAlert className="w-5 h-5 text-red-500" />
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="space-y-0.5">
                                <Label className="text-base text-red-200">Maintenance Mode</Label>
                                <p className="text-sm text-red-300/70">
                                    Prevent all non-admin access to the platform.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maintenance_mode}
                                onCheckedChange={(c) => setSettings(s => ({ ...s, maintenance_mode: c }))}
                                className="data-[state=checked]:bg-red-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-zinc-200">Global Support Email</Label>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-zinc-500" />
                                <Input
                                    value={settings.support_email}
                                    onChange={(e) => setSettings(s => ({ ...s, support_email: e.target.value }))}
                                    className="bg-zinc-950 border-zinc-700 text-zinc-100"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
