'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LANDING_PAGE_TEMPLATES, LandingPageTemplate } from '@/lib/landing-page-templates';
import { Check, LayoutTemplate, ArrowRight, Zap, Filter } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TemplateGalleryProps {
    onSelect: (templateId: string) => void;
    onCancel: () => void;
}

export function TemplateGallery({ onSelect, onCancel }: TemplateGalleryProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredTemplates = selectedCategory === 'all'
        ? LANDING_PAGE_TEMPLATES
        : LANDING_PAGE_TEMPLATES.filter(t => t.category === selectedCategory);

    const categories = [
        { id: 'all', label: 'All Templates' },
        { id: 'funnel', label: 'Funnels' },
        { id: 'ecommerce', label: 'E-commerce' },
        { id: 'lead-gen', label: 'Lead Gen' },
        { id: 'event', label: 'Events' },
        { id: 'saas', label: 'SaaS' },
    ];

    return (
        <div className="flex flex-col h-[80vh]">
            <div className="flex items-center justify-between pb-6 border-b shrink-0">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutTemplate className="w-6 h-6 text-primary" />
                        Choose a Template
                    </h2>
                    <p className="text-muted-foreground mt-1">Start with a proven high-converting structure or build from scratch.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                </div>
            </div>

            <div className="flex gap-2 py-4 shrink-0 overflow-x-auto">
                {categories.map(cat => (
                    <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id)}
                        className="rounded-full"
                    >
                        {cat.label}
                    </Button>
                ))}
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {/* Blank Template Option */}
                    <Card className="flex flex-col border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => onSelect('blank')}>
                        <CardHeader>
                            <CardTitle className="group-hover:text-primary transition-colors">Blank Canvas</CardTitle>
                            <CardDescription>Start from scratch with zero formatting.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex items-center justify-center min-h-[140px] text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                            <LayoutTemplate className="w-24 h-24" />
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="outline">Start Blank</Button>
                        </CardFooter>
                    </Card>

                    {/* Pre-built Templates */}
                    {filteredTemplates.map((template) => (
                        <Card key={template.id} className="flex flex-col hover:shadow-lg transition-shadow overflow-hidden group">
                            <div className="h-32 bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                                {/* Abstract Preview - In real app, use screenshots */}
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                    <Zap className="w-16 h-16" />
                                </div>
                                {template.badge && (
                                    <div className="absolute top-3 right-3">
                                        <Badge className="bg-primary/90 hover:bg-primary">{template.badge}</Badge>
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                            </CardHeader>
                            {/* <CardContent className="flex-1">
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary" className="text-[10px] uppercase font-normal">{template.category}</Badge>
                                    <span>• Optimized Conversion</span>
                                </div>
                            </CardContent> */}
                            <CardFooter className="mt-auto">
                                <Button className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground" onClick={() => onSelect(template.id)}>
                                    Use Template <ArrowRight className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}
