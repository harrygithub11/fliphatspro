'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save } from 'lucide-react';

export function GeneralSettings() {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // State for dates
    const [offerDate, setOfferDate] = useState(''); // Lifetime Offer
    const [newYearDate, setNewYearDate] = useState(''); // New Year Offer

    useEffect(() => {
        fetchSettings();
    }, []);

    // Helper to format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Adjust for timezone offset to show correct local time or keep scalar if already formatted
        // Simple approach: slice the ISO string if it's already ISO, or format it
        // But datetime-local needs local time.

        // Robust way:
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            console.log('Settings Data:', data); // Debugging

            if (data.offer_end_date) {
                console.log('Formatted Offer Date:', formatDateForInput(data.offer_end_date));
                setOfferDate(formatDateForInput(data.offer_end_date));
            }
            if (data.newyear_offer_date) {
                console.log('Formatted New Year Date:', formatDateForInput(data.newyear_offer_date));
                setNewYearDate(formatDateForInput(data.newyear_offer_date));
            }

        } catch (error) {
            console.error('Failed to load settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save Lifetime Offer Date
            if (offerDate) {
                await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: 'offer_end_date',
                        value: offerDate,
                        description: 'End date for Lifetime Offer (12k)'
                    })
                });
            }

            // Save New Year Offer Date
            if (newYearDate) {
                await fetch('/api/admin/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        key: 'newyear_offer_date',
                        value: newYearDate,
                        description: 'End date for New Year Offer (5k)'
                    })
                });
            }

            alert('Settings saved successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Offer Settings</CardTitle>
                <CardDescription>Control the deadlines and timers shown on the landing pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Lifetime Offer Section */}
                <div className="grid gap-3">
                    <Label htmlFor="date" className="text-base font-semibold">Lifetime Offer (12k) End Date</Label>
                    <div className="flex flex-col gap-2">
                        <Input
                            id="date"
                            type="datetime-local"
                            value={offerDate}
                            onChange={(e) => setOfferDate(e.target.value)}
                            className="max-w-md"
                        />
                        <p className="text-sm text-muted-foreground">
                            Controls the timer on the <strong>Lifetime Offer</strong> page.
                        </p>
                    </div>
                </div>

                <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full" />

                {/* New Year Offer Section */}
                <div className="grid gap-3">
                    <Label htmlFor="ny-date" className="text-base font-semibold">New Year Offer (5k) End Date</Label>
                    <div className="flex flex-col gap-2">
                        <Input
                            id="ny-date"
                            type="datetime-local"
                            value={newYearDate}
                            onChange={(e) => setNewYearDate(e.target.value)}
                            className="max-w-md"
                        />
                        <p className="text-sm text-muted-foreground">
                            Controls the timer on the <strong>New Year Offer</strong> page.
                        </p>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Dates
                    </Button>
                </div>

            </CardContent>
        </Card>
    );
}
