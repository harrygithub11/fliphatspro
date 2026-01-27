'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Play, Square } from 'lucide-react';

interface ABTestPanelProps {
    abTests: any;
    onUpdate: (val: any) => void;
}

export function ABTestPanel({ abTests, onUpdate }: ABTestPanelProps) {
    const activeTest = abTests?.active_test;
    const [newTestTitle, setNewTestTitle] = useState('');
    const [variantName, setVariantName] = useState('Variant B');
    const [trafficSplit, setTrafficSplit] = useState(50);

    // Simple Override State (for MVP)
    const [variantConfig, setVariantConfig] = useState('{\n  "hero": {\n    "cta_text": "Join Now",\n    "headline": "Wait! Don\'t Miss This"\n  }\n}');

    const handleCreateTest = () => {
        let parsedConfig = {};
        try {
            parsedConfig = JSON.parse(variantConfig);
        } catch (e) {
            alert('Invalid JSON Config');
            return;
        }

        const newTest = {
            id: 'test_' + Date.now(),
            name: newTestTitle || 'Untitled Test',
            started_at: new Date().toISOString(),
            variants: [
                {
                    id: 'control',
                    name: 'Control (A)',
                    traffic_split: 100 - trafficSplit,
                    config: {},
                    stats: { impressions: 0, clicks: 0, conversions: 0 }
                },
                {
                    id: 'variant_b',
                    name: variantName,
                    traffic_split: trafficSplit,
                    config: parsedConfig,
                    stats: { impressions: 0, clicks: 0, conversions: 0 }
                }
            ]
        };

        onUpdate({ ...abTests, active_test: newTest });
    };

    const handleStopTest = () => {
        if (!confirm('Are you sure you want to stop the test?')) return;
        onUpdate({ ...abTests, active_test: null, history: [...(abTests?.history || []), activeTest] });
    };

    if (activeTest) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Experiment: {activeTest.name}
                                <Badge variant="default" className="bg-green-600">Running</Badge>
                            </CardTitle>
                            <CardDescription>Started on {new Date(activeTest.started_at).toLocaleDateString()}</CardDescription>
                        </div>
                        <Button variant="destructive" size="sm" onClick={handleStopTest}>
                            <Square className="w-4 h-4 mr-2" /> Stop Test
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        {activeTest.variants.map((v: any) => (
                            <Card key={v.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 border-l-4 border-l-primary">
                                <h4 className="font-bold mb-2">{v.name} ({v.traffic_split}%)</h4>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="text-center">
                                        <div className="text-muted-foreground">Views</div>
                                        <div className="font-mono text-lg">{v.stats.impressions}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-muted-foreground">Clicks</div>
                                        <div className="font-mono text-lg">{v.stats.clicks}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-muted-foreground">Conv.</div>
                                        <div className="font-mono text-lg">{v.stats.conversions}</div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Create View
    return (
        <Card>
            <CardHeader>
                <CardTitle>Create A/B Test</CardTitle>
                <CardDescription>Run an experiment to optimize your page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2">
                    <Label>Test Name</Label>
                    <Input placeholder="e.g. Hero Headline Test" value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)} />
                </div>

                <div className="grid gap-2">
                    <Label>Variant B Name</Label>
                    <Input placeholder="Variant B" value={variantName} onChange={e => setVariantName(e.target.value)} />
                </div>

                <div className="grid gap-4 py-4">
                    <Label>Traffic Split (Variant B: {trafficSplit}%)</Label>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-12 text-right">{100 - trafficSplit}%</span>
                        <input
                            type="range"
                            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700"
                            min="10"
                            max="90"
                            step="10"
                            value={trafficSplit}
                            onChange={(e) => setTrafficSplit(parseInt(e.target.value))}
                        />
                        <span className="text-sm font-bold w-12">{trafficSplit}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Control vs Variant B</p>
                </div>

                <div className="grid gap-2">
                    <Label>Variant B Overrides (JSON)</Label>
                    <p className="text-xs text-muted-foreground">Specify content fields to override for this variant.</p>
                    <textarea
                        className="w-full h-32 p-2 border rounded-md font-mono text-sm bg-zinc-50 dark:bg-zinc-900"
                        value={variantConfig}
                        onChange={e => setVariantConfig(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCreateTest} className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Play className="w-4 h-4 mr-2" /> Start Experiment
                </Button>
            </CardFooter>
        </Card>
    );
}
