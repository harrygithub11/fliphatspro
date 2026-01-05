'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GeneralSettings } from './components/GeneralSettings';

export default function SettingsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        site_name: '',
        razorpay_key_id: '',
        razorpay_key_secret: '',
        facebook_pixel_id: '',
        google_analytics_id: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast({
                    title: 'Settings saved',
                    description: 'Your settings have been updated successfully.',
                });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save settings. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your application settings</p>
            </div>

            {/* Offer Settings Component */}
            <GeneralSettings />

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>API & Integration Settings</CardTitle>
                        <CardDescription>Configure your site and integrations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="site_name">Site Name</Label>
                            <Input
                                id="site_name"
                                value={settings.site_name}
                                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                                placeholder="FliphatMedia"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="razorpay_key_id">Razorpay Key ID</Label>
                            <Input
                                id="razorpay_key_id"
                                value={settings.razorpay_key_id}
                                onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                                placeholder="rzp_test_..."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="razorpay_key_secret">Razorpay Key Secret</Label>
                            <Input
                                id="razorpay_key_secret"
                                type="password"
                                value={settings.razorpay_key_secret}
                                onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                            <Input
                                id="facebook_pixel_id"
                                value={settings.facebook_pixel_id}
                                onChange={(e) => setSettings({ ...settings, facebook_pixel_id: e.target.value })}
                                placeholder="123456789012345"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                            <Input
                                id="google_analytics_id"
                                value={settings.google_analytics_id}
                                onChange={(e) => setSettings({ ...settings, google_analytics_id: e.target.value })}
                                placeholder="G-XXXXXXXXXX"
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Settings
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
