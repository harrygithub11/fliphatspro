'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash, Save, ArrowLeft, Loader2, Zap, LayoutTemplate, Settings2, CreditCard, Users, HelpCircle, Code } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { MediaPicker } from '@/components/admin/MediaPicker';
import { SectionOrderPanel } from '@/components/admin/pages/SectionOrderPanel';
import { ABTestPanel } from '@/components/admin/pages/ABTestPanel';
import { DEFAULT_PAGE_CONTENT } from '@/lib/constants';
import { deepMerge } from '@/lib/utils';

interface PageEditorProps {
    initialData?: any;
    isEditing?: boolean;
}

export default function PageEditor({ initialData, isEditing = false }: PageEditorProps) {
    const router = useRouter();
    const params = useParams();
    const workspaceSlug = params?.slug as string;
    const [loading, setLoading] = useState(false);

    // Core Page Fields
    const [name, setName] = useState(initialData?.name || '');
    const [slug, setSlug] = useState(initialData?.slug || '');
    const [isActive, setIsActive] = useState(initialData?.is_active ?? true);

    // AB Testing State
    const [abTests, setAbTests] = useState(initialData?.ab_tests ? (typeof initialData.ab_tests === 'string' ? JSON.parse(initialData.ab_tests) : initialData.ab_tests) : {});

    // JSON Content Structure - Initialize with defaults safety
    // Deep clone default content to avoid mutation, and handle undefined initialData
    const [content, setContent] = useState(deepMerge(
        JSON.parse(JSON.stringify(DEFAULT_PAGE_CONTENT)),
        initialData?.content || {}
    ));

    const { hero } = content;

    // Helper to update deep nested state
    const updateContent = (section: string, field: string, value: any) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Helper for deeply nested CTA modes
    const updateCtaMode = (mode: string, field: string, value: any) => {
        setContent((prev: any) => ({
            ...prev,
            cta_configuration: {
                ...prev.cta_configuration,
                modes: {
                    ...(prev.cta_configuration?.modes || {}),
                    [mode]: {
                        ...(prev.cta_configuration?.modes?.[mode] || {}),
                        [field]: value
                    }
                }
            }
        }));
    };

    const addRepeaterItem = (section: string, newItem: any) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: [...(prev[section] || []), newItem]
        }));
    };

    const removeRepeaterItem = (section: string, index: number) => {
        setContent((prev: any) => ({
            ...prev,
            [section]: prev[section].filter((_: any, i: number) => i !== index)
        }));
    };

    const updateRepeaterItem = (section: string, index: number, field: string, value: any) => {
        const newItems = [...(content[section] || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setContent((prev: any) => ({
            ...prev,
            [section]: newItems
        }));
    };

    // Section Order Logic
    const SECTION_LABELS: Record<string, string> = {
        hero: 'Hero Section',
        marquee: 'Highlight Marquee',
        problem_section: 'Problem/Agitation',
        live_demos: 'Live Demos',
        comparison_table: 'Comparison Table',
        features: 'Features Grid',
        order_flow: 'Order Flow',
        setup_process: 'Setup Process',
        testimonials: 'Testimonials',
        pricing: 'Pricing & CTA',
        faq: 'FAQ'
    };

    const orderedSections = (content.section_order || DEFAULT_PAGE_CONTENT.section_order || []).map((id: string) => ({
        id,
        label: SECTION_LABELS[id] || id,
        enabled: content[id]?.enabled ?? true, // Default to true for arrays/objects without enabled flag
        canToggle: ['marquee', 'problem_section', 'live_demos', 'comparison_table', 'order_flow', 'setup_process'].includes(id)
    }));

    const handleSectionReorder = (newOrder: string[]) => {
        setContent((prev: any) => ({
            ...prev,
            section_order: newOrder
        }));
    };

    const handleSectionToggle = (id: string, enabled: boolean) => {
        if (['marquee', 'problem_section', 'live_demos', 'comparison_table', 'order_flow', 'setup_process'].includes(id)) {
            updateContent(id, 'enabled', enabled);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        const payload = {
            name,
            slug,
            content,
            is_active: isActive,
            ab_tests: abTests
        };

        try {
            const url = isEditing ? `/api/admin/pages/${initialData.id}` : '/api/admin/pages';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                alert('Page saved successfully!');
                if (!isEditing) router.push(`/${workspaceSlug}/pages/${data.id}`);
            } else {
                alert(data.error || 'Failed to save page');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 z-50 bg-background/95 backdrop-blur py-4 border-b">
                <div className="flex items-center gap-4">
                    <Link href={`/${workspaceSlug}/pages`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">{isEditing ? `Edit: ${name}` : 'Create New Page'}</h1>
                        <p className="text-xs text-muted-foreground mr-2">
                            {slug ? `URL: /sale/${slug}` : 'Define your URL slug'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                        <span className="text-sm font-medium">{isActive ? 'Published' : 'Draft'}</span>
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="min-w-[120px]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Page
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Settings Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Page Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Internal Name</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Black Friday 2026" />
                            </div>
                            <div>
                                <Label>URL Slug</Label>
                                <div className="flex items-center">
                                    <span className="text-sm text-muted-foreground mr-1">/sale/</span>
                                    <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="black-friday" className="font-mono text-sm" />
                                </div>
                            </div>
                            <div>
                                <Label>Offer End Date</Label>
                                <Input
                                    type="datetime-local"
                                    value={content.settings?.timer_end_date?.substring(0, 16) || ''}
                                    onChange={e => updateContent('settings', 'timer_end_date', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Integrations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Google Analytics ID</Label>
                                <Input
                                    value={content.integrations?.google_analytics_id || ''}
                                    onChange={e => updateContent('integrations', 'google_analytics_id', e.target.value)}
                                    placeholder="G-XXXXXXXX"
                                />
                            </div>
                            <div>
                                <Label>Facebook Pixel ID</Label>
                                <Input
                                    value={content.integrations?.facebook_pixel_id || ''}
                                    onChange={e => updateContent('integrations', 'facebook_pixel_id', e.target.value)}
                                    placeholder="123456789"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Content Editor */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="hero" className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="layout"><LayoutTemplate className="w-4 h-4 mr-2" /> Layout</TabsTrigger>
                            <TabsTrigger value="ab_testing"><Zap className="w-4 h-4 mr-2" /> A/B Testing</TabsTrigger>
                            <TabsTrigger value="hero"><LayoutTemplate className="w-4 h-4 mr-2" /> Hero</TabsTrigger>
                            <TabsTrigger value="cta"><CreditCard className="w-4 h-4 mr-2" /> CTA & Pricing</TabsTrigger>
                            <TabsTrigger value="problem"><HelpCircle className="w-4 h-4 mr-2" /> Problem</TabsTrigger>
                            <TabsTrigger value="sections"><Settings2 className="w-4 h-4 mr-2" /> Other Sections</TabsTrigger>
                            <TabsTrigger value="features"><Zap className="w-4 h-4 mr-2" /> Features</TabsTrigger>
                            <TabsTrigger value="testimonials"><Users className="w-4 h-4 mr-2" /> Testimonials</TabsTrigger>
                            <TabsTrigger value="faq"><HelpCircle className="w-4 h-4 mr-2" /> FAQ</TabsTrigger>
                        </TabsList>

                        <TabsContent value="layout" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Page Layout</CardTitle>
                                    <CardDescription>Drag and drop sections to reorder your page properly.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SectionOrderPanel
                                        sections={orderedSections}
                                        onReorder={handleSectionReorder}
                                        onToggle={handleSectionToggle}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="ab_testing" className="space-y-6 mt-6">
                            <ABTestPanel abTests={abTests} onUpdate={setAbTests} />
                        </TabsContent>



                        <TabsContent value="hero" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader><CardTitle>Hero Section</CardTitle><CardDescription>The first thing users see.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Headline</Label>
                                        <Input value={hero.headline} onChange={e => updateContent('hero', 'headline', e.target.value)} />
                                    </div>
                                    <div>
                                        <Label>Subheadline</Label>
                                        <Textarea value={hero.subheadline} onChange={e => updateContent('hero', 'subheadline', e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Announcement Badge</Label>
                                            <Input value={hero.announcement_badge} onChange={e => updateContent('hero', 'announcement_badge', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>CTA Text</Label>
                                            <Input value={hero.cta_text} onChange={e => updateContent('hero', 'cta_text', e.target.value)} />
                                        </div>
                                    </div>

                                    <MediaPicker
                                        label="Video Cover Image (Thumbnail)"
                                        value={hero.thumbnail_src}
                                        onChange={url => updateContent('hero', 'thumbnail_src', url)}
                                    />

                                    <MediaPicker
                                        label="Hero Video Source (MP4)"
                                        type="video"
                                        value={hero.video_src}
                                        onChange={url => updateContent('hero', 'video_src', url)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="cta" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader><CardTitle>CTA Configuration</CardTitle></CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label>Primary CTA Mode</Label>
                                        <select
                                            className="w-full border rounded-md p-2 bg-background"
                                            value={content.cta_configuration?.primary_mode}
                                            onChange={e => updateContent('cta_configuration', 'primary_mode', e.target.value)}
                                        >
                                            <option value="razorpay_api">Razorpay API (Popup)</option>
                                            <option value="payment_link">Payment Link (Redirect)</option>
                                            <option value="booking">Book a Call (Calendly)</option>
                                            <option value="lead_form">Lead Capture Form (Manual)</option>
                                        </select>
                                    </div>

                                    {/* Conditional Settings based on mode */}
                                    <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border">
                                        <h3 className="font-semibold mb-4 text-sm uppercase text-muted-foreground">Detailed Configuration</h3>

                                        <div className="grid gap-4">
                                            {content.cta_configuration?.primary_mode === 'razorpay_api' && (
                                                <div>
                                                    <Label>Razorpay Amount (in Paise)</Label>
                                                    <Input
                                                        type="number"
                                                        value={content.cta_configuration?.modes?.razorpay_api?.amount || 0}
                                                        onChange={e => updateCtaMode('razorpay_api', 'amount', parseInt(e.target.value))}
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">Example: 499900 = ₹4999.00</p>
                                                </div>
                                            )}

                                            {content.cta_configuration?.primary_mode === 'payment_link' && (
                                                <div>
                                                    <Label>Payment Link URL</Label>
                                                    <Input
                                                        value={content.cta_configuration?.modes?.payment_link?.url || ''}
                                                        onChange={e => updateCtaMode('payment_link', 'url', e.target.value)}
                                                        placeholder="https://rzp.io/..."
                                                    />
                                                </div>
                                            )}

                                            {content.cta_configuration?.primary_mode === 'booking' && (
                                                <div>
                                                    <Label>Booking URL (Calendly)</Label>
                                                    <Input
                                                        value={content.cta_configuration?.modes?.booking?.url || ''}
                                                        onChange={e => updateCtaMode('booking', 'url', e.target.value)}
                                                        placeholder="https://calendly.com/..."
                                                    />
                                                    <div className="mt-2">
                                                        <Label>Button Text</Label>
                                                        <Input
                                                            value={content.cta_configuration?.modes?.booking?.button_text || ''}
                                                            onChange={e => updateCtaMode('booking', 'button_text', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {content.cta_configuration?.primary_mode === 'lead_form' && (
                                                <div>
                                                    <Label>Button Text</Label>
                                                    <Input
                                                        value={content.cta_configuration?.modes?.lead_form?.button_text || ''}
                                                        onChange={e => updateCtaMode('lead_form', 'button_text', e.target.value)}
                                                        placeholder="Get Instant Access"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-2">Opens a popup form to capture Name, Email, Phone.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t pt-4 mt-4 space-y-4">
                                        <Label className="mb-2 block font-bold">Display Pricing & Offer</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs">Offer Title</Label>
                                                <Input
                                                    value={content.pricing?.title}
                                                    onChange={e => updateContent('pricing', 'title', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Sub-headline</Label>
                                                <Input
                                                    value={content.pricing?.description}
                                                    onChange={e => updateContent('pricing', 'description', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-xs">Sale Price (Display)</Label>
                                                <Input
                                                    type="number"
                                                    value={content.pricing?.sale_price}
                                                    onChange={e => updateContent('pricing', 'sale_price', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Original Price</Label>
                                                <Input
                                                    type="number"
                                                    value={content.pricing?.original_price}
                                                    onChange={e => updateContent('pricing', 'original_price', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-xs">Main CTA Button Text</Label>
                                            <Input
                                                value={content.pricing?.button_text}
                                                onChange={e => updateContent('pricing', 'button_text', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <Label className="text-xs">Pricing Plan Features</Label>
                                                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => {
                                                    const newFeatures = [...(content.pricing?.features || [])];
                                                    newFeatures.push("");
                                                    updateContent('pricing', 'features', newFeatures);
                                                }}>
                                                    <Plus className="w-3 h-3 mr-1" /> Add Feature
                                                </Button>
                                            </div>
                                            <div className="space-y-2">
                                                {(content.pricing?.features || []).map((f: string, i: number) => (
                                                    <div key={i} className="flex gap-2">
                                                        <Input
                                                            value={f}
                                                            onChange={e => {
                                                                const newFeatures = [...(content.pricing?.features || [])];
                                                                newFeatures[i] = e.target.value;
                                                                updateContent('pricing', 'features', newFeatures);
                                                            }}
                                                            placeholder="e.g. Complete e-commerce website"
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newFeatures = [...(content.pricing?.features || [])];
                                                            newFeatures.splice(i, 1);
                                                            updateContent('pricing', 'features', newFeatures);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="problem" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Problem & Agitation Section</CardTitle>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Enabled</Label>
                                            <Switch
                                                checked={content.problem_section?.enabled}
                                                onCheckedChange={v => updateContent('problem_section', 'enabled', v)}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Title</Label>
                                            <Input value={content.problem_section?.title} onChange={e => updateContent('problem_section', 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Annotation Label</Label>
                                            <Input value={content.problem_section?.subtitle} onChange={e => updateContent('problem_section', 'subtitle', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label>Agitation Cards</Label>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const newCards = [...(content.problem_section?.cards || [])];
                                                newCards.push({ title: '', heading: '', text: '', img: '' });
                                                updateContent('problem_section', 'cards', newCards);
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Card
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(content.problem_section?.cards || []).map((card: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                                                    <div className="flex justify-between">
                                                        <Label className="font-bold text-red-500 uppercase">Card #{i + 1}</Label>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newCards = [...(content.problem_section?.cards || [])];
                                                            newCards.splice(i, 1);
                                                            updateContent('problem_section', 'cards', newCards);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Badge Title</Label>
                                                            <Input value={card.title} onChange={e => {
                                                                const newCards = [...(content.problem_section?.cards || [])];
                                                                newCards[i] = { ...newCards[i], title: e.target.value };
                                                                updateContent('problem_section', 'cards', newCards);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label>Heading</Label>
                                                            <Input value={card.heading} onChange={e => {
                                                                const newCards = [...(content.problem_section?.cards || [])];
                                                                newCards[i] = { ...newCards[i], heading: e.target.value };
                                                                updateContent('problem_section', 'cards', newCards);
                                                            }} />
                                                        </div>
                                                    </div>
                                                    <Textarea value={card.text} onChange={e => {
                                                        const newCards = [...(content.problem_section?.cards || [])];
                                                        newCards[i] = { ...newCards[i], text: e.target.value };
                                                        updateContent('problem_section', 'cards', newCards);
                                                    }} placeholder="Description text..." />
                                                    <MediaPicker
                                                        label="Card Image"
                                                        value={card.img}
                                                        onChange={url => {
                                                            const newCards = [...(content.problem_section?.cards || [])];
                                                            newCards[i] = { ...newCards[i], img: url };
                                                            updateContent('problem_section', 'cards', newCards);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sections" className="space-y-6 mt-6">
                            {/* Marquee Settings */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Highlight Marquee</CardTitle>
                                        <Switch
                                            checked={content.marquee?.enabled}
                                            onCheckedChange={v => updateContent('marquee', 'enabled', v)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Label>Banner Text</Label>
                                    <Input value={content.marquee?.text} onChange={e => updateContent('marquee', 'text', e.target.value)} />
                                </CardContent>
                            </Card>

                            {/* Live Demos Settings */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Live Demos</CardTitle>
                                        <Switch
                                            checked={content.live_demos?.enabled}
                                            onCheckedChange={v => updateContent('live_demos', 'enabled', v)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Title</Label>
                                            <Input value={content.live_demos?.title} onChange={e => updateContent('live_demos', 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Description</Label>
                                            <Input value={content.live_demos?.description} onChange={e => updateContent('live_demos', 'description', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label>Demo Cards</Label>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const newItems = [...(content.live_demos?.items || [])];
                                                newItems.push({ title: '', subtitle: '', desc: '', video: '', link: '', action: 'Visit', icon: 'ShoppingBag', color: '' });
                                                updateContent('live_demos', 'items', newItems);
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Demo
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(content.live_demos?.items || []).map((item: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                                                    <div className="flex justify-between">
                                                        <Label className="font-bold">Demo #{i + 1}</Label>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newItems = [...(content.live_demos?.items || [])];
                                                            newItems.splice(i, 1);
                                                            updateContent('live_demos', 'items', newItems);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Title</Label>
                                                            <Input value={item.title} onChange={e => {
                                                                const newItems = [...(content.live_demos?.items || [])];
                                                                newItems[i] = { ...newItems[i], title: e.target.value };
                                                                updateContent('live_demos', 'items', newItems);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label>Subtitle</Label>
                                                            <Input value={item.subtitle} onChange={e => {
                                                                const newItems = [...(content.live_demos?.items || [])];
                                                                newItems[i] = { ...newItems[i], subtitle: e.target.value };
                                                                updateContent('live_demos', 'items', newItems);
                                                            }} />
                                                        </div>
                                                    </div>
                                                    <Textarea value={item.desc} onChange={e => {
                                                        const newItems = [...(content.live_demos?.items || [])];
                                                        newItems[i] = { ...newItems[i], desc: e.target.value };
                                                        updateContent('live_demos', 'items', newItems);
                                                    }} placeholder="Description..." />
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <MediaPicker
                                                            label="Preview Video (MP4)"
                                                            value={item.video}
                                                            onChange={url => {
                                                                const newItems = [...(content.live_demos?.items || [])];
                                                                newItems[i] = { ...newItems[i], video: url };
                                                                updateContent('live_demos', 'items', newItems);
                                                            }}
                                                        />
                                                        <div>
                                                            <Label>Link URL</Label>
                                                            <Input value={item.link} onChange={e => {
                                                                const newItems = [...(content.live_demos?.items || [])];
                                                                newItems[i] = { ...newItems[i], link: e.target.value };
                                                                updateContent('live_demos', 'items', newItems);
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Comparison Table */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Comparison Table</CardTitle>
                                        <Switch
                                            checked={content.comparison_table?.enabled}
                                            onCheckedChange={v => updateContent('comparison_table', 'enabled', v)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Title</Label>
                                            <Input value={content.comparison_table?.title} onChange={e => updateContent('comparison_table', 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Badge Text</Label>
                                            <Input value={content.comparison_table?.badge} onChange={e => updateContent('comparison_table', 'badge', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label>Comparison Rows</Label>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const newRows = [...(content.comparison_table?.rows || [])];
                                                newRows.push({ name: '', fliphat: '', shopify: '', description: '' });
                                                updateContent('comparison_table', 'rows', newRows);
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Row
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(content.comparison_table?.rows || []).map((row: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                                                    <div className="flex justify-between">
                                                        <Label className="font-bold">Feature #{i + 1}</Label>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newRows = [...(content.comparison_table?.rows || [])];
                                                            newRows.splice(i, 1);
                                                            updateContent('comparison_table', 'rows', newRows);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Feature Name</Label>
                                                            <Input value={row.name} onChange={e => {
                                                                const newRows = [...(content.comparison_table?.rows || [])];
                                                                newRows[i] = { ...newRows[i], name: e.target.value };
                                                                updateContent('comparison_table', 'rows', newRows);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label>Our Value</Label>
                                                            <Input value={row.fliphat} onChange={e => {
                                                                const newRows = [...(content.comparison_table?.rows || [])];
                                                                newRows[i] = { ...newRows[i], fliphat: e.target.value };
                                                                updateContent('comparison_table', 'rows', newRows);
                                                            }} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label>Competitor Value</Label>
                                                            <Input value={row.shopify} onChange={e => {
                                                                const newRows = [...(content.comparison_table?.rows || [])];
                                                                newRows[i] = { ...newRows[i], shopify: e.target.value };
                                                                updateContent('comparison_table', 'rows', newRows);
                                                            }} />
                                                        </div>
                                                        <div>
                                                            <Label>Brief Description</Label>
                                                            <Input value={row.description} onChange={e => {
                                                                const newRows = [...(content.comparison_table?.rows || [])];
                                                                newRows[i] = { ...newRows[i], description: e.target.value };
                                                                updateContent('comparison_table', 'rows', newRows);
                                                            }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Order Flow Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Order Flow Visualization</CardTitle>
                                        <Switch
                                            checked={content.order_flow?.enabled}
                                            onCheckedChange={v => updateContent('order_flow', 'enabled', v)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Title</Label>
                                            <Input value={content.order_flow?.title} onChange={e => updateContent('order_flow', 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Subtitle</Label>
                                            <Input value={content.order_flow?.subtitle} onChange={e => updateContent('order_flow', 'subtitle', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label>Flow Steps</Label>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const newItems = [...(content.order_flow?.items || [])];
                                                newItems.push({ title: '', desc: '', image: '', icon: 'ShoppingBag' });
                                                updateContent('order_flow', 'items', newItems);
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Step
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(content.order_flow?.items || []).map((step: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                                                    <div className="flex justify-between">
                                                        <Label className="font-bold">Step #{i + 1}</Label>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newItems = [...(content.order_flow?.items || [])];
                                                            newItems.splice(i, 1);
                                                            updateContent('order_flow', 'items', newItems);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <Input value={step.title} placeholder="Step Title" onChange={e => {
                                                            const newItems = [...(content.order_flow?.items || [])];
                                                            newItems[i] = { ...newItems[i], title: e.target.value };
                                                            updateContent('order_flow', 'items', newItems);
                                                        }} />
                                                        <Input value={step.icon} placeholder="Lucide Icon Name" onChange={e => {
                                                            const newItems = [...(content.order_flow?.items || [])];
                                                            newItems[i] = { ...newItems[i], icon: e.target.value };
                                                            updateContent('order_flow', 'items', newItems);
                                                        }} />
                                                    </div>
                                                    <Textarea value={step.desc} placeholder="Step Description" onChange={e => {
                                                        const newItems = [...(content.order_flow?.items || [])];
                                                        newItems[i] = { ...newItems[i], desc: e.target.value };
                                                        updateContent('order_flow', 'items', newItems);
                                                    }} />
                                                    <MediaPicker
                                                        label="Step Image"
                                                        value={step.image}
                                                        onChange={url => {
                                                            const newItems = [...(content.order_flow?.items || [])];
                                                            newItems[i] = { ...newItems[i], image: url };
                                                            updateContent('order_flow', 'items', newItems);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Setup Process Section */}
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Setup Process (Timeline)</CardTitle>
                                        <Switch
                                            checked={content.setup_process?.enabled}
                                            onCheckedChange={v => updateContent('setup_process', 'enabled', v)}
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Title</Label>
                                            <Input value={content.setup_process?.title} onChange={e => updateContent('setup_process', 'title', e.target.value)} />
                                        </div>
                                        <div>
                                            <Label>Subtitle</Label>
                                            <Input value={content.setup_process?.subtitle} onChange={e => updateContent('setup_process', 'subtitle', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <Label>Timeline Steps</Label>
                                            <Button size="sm" variant="outline" onClick={() => {
                                                const newItems = [...(content.setup_process?.items || [])];
                                                newItems.push({ step: '01', title: '', desc: '', icon: 'Zap' });
                                                updateContent('setup_process', 'items', newItems);
                                            }}>
                                                <Plus className="w-4 h-4 mr-2" /> Add Step
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {(content.setup_process?.items || []).map((s: any, i: number) => (
                                                <div key={i} className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50 space-y-4">
                                                    <div className="flex justify-between">
                                                        <Label className="font-bold">Step #{i + 1}</Label>
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newItems = [...(content.setup_process?.items || [])];
                                                            newItems.splice(i, 1);
                                                            updateContent('setup_process', 'items', newItems);
                                                        }}><Trash className="w-4 h-4 text-red-500" /></Button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <Input value={s.step} placeholder="Step #" onChange={e => {
                                                            const newItems = [...(content.setup_process?.items || [])];
                                                            newItems[i] = { ...newItems[i], step: e.target.value };
                                                            updateContent('setup_process', 'items', newItems);
                                                        }} />
                                                        <Input value={s.title} placeholder="Title" className="col-span-2" onChange={e => {
                                                            const newItems = [...(content.setup_process?.items || [])];
                                                            newItems[i] = { ...newItems[i], title: e.target.value };
                                                            updateContent('setup_process', 'items', newItems);
                                                        }} />
                                                    </div>
                                                    <Textarea value={s.desc} placeholder="Description" onChange={e => {
                                                        const newItems = [...(content.setup_process?.items || [])];
                                                        newItems[i] = { ...newItems[i], desc: e.target.value };
                                                        updateContent('setup_process', 'items', newItems);
                                                    }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="features" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Features Section Config</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Section Headline</Label>
                                            <Input
                                                value={content.features_config?.headline}
                                                onChange={e => updateContent('features_config', 'headline', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Section Sub-headline</Label>
                                            <Input
                                                value={content.features_config?.subheadline}
                                                onChange={e => updateContent('features_config', 'subheadline', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Features List</CardTitle>
                                        <Button size="sm" onClick={() => addRepeaterItem('features', { title: 'New Feature', description: '', icon: 'Zap' })}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Feature
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {content.features?.map((feature: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="space-y-2 flex-1">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input
                                                        value={feature.title}
                                                        onChange={e => updateRepeaterItem('features', i, 'title', e.target.value)}
                                                        placeholder="Feature Title"
                                                        className="font-bold"
                                                    />
                                                    <Input
                                                        value={feature.icon}
                                                        onChange={e => updateRepeaterItem('features', i, 'icon', e.target.value)}
                                                        placeholder="Lucide Icon Name"
                                                    />
                                                </div>
                                                <Textarea
                                                    value={feature.description}
                                                    onChange={e => updateRepeaterItem('features', i, 'description', e.target.value)}
                                                    placeholder="Description"
                                                    className="h-20"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <Label className="text-xs">Icon Name (Lucide):</Label>
                                                    <Input
                                                        value={feature.icon}
                                                        onChange={e => updateRepeaterItem('features', i, 'icon', e.target.value)}
                                                        className="w-40 h-8 text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeRepeaterItem('features', i)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {content.features?.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No features added yet.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="testimonials" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Testimonials</CardTitle>
                                        <Button size="sm" onClick={() => addRepeaterItem('testimonials', { name: 'New User', role: 'Customer', content: '', avatar_url: '' })}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Testimonial
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {content.testimonials?.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="space-y-2 flex-1">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input
                                                        value={item.name}
                                                        onChange={e => updateRepeaterItem('testimonials', i, 'name', e.target.value)}
                                                        placeholder="Name"
                                                        className="font-bold"
                                                    />
                                                    <Input
                                                        value={item.role}
                                                        onChange={e => updateRepeaterItem('testimonials', i, 'role', e.target.value)}
                                                        placeholder="Role/Company"
                                                    />
                                                </div>
                                                <Textarea
                                                    value={item.content}
                                                    onChange={e => updateRepeaterItem('testimonials', i, 'content', e.target.value)}
                                                    placeholder="Testimonial content..."
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeRepeaterItem('testimonials', i)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="faq" className="space-y-6 mt-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Frequently Asked Questions</CardTitle>
                                        <Button size="sm" onClick={() => addRepeaterItem('faq', { question: '', answer: '' })}>
                                            <Plus className="w-4 h-4 mr-2" /> Add Question
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {content.faq?.map((item: any, i: number) => (
                                        <div key={i} className="flex gap-4 items-start p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                                            <div className="space-y-2 flex-1">
                                                <Input
                                                    value={item.question}
                                                    onChange={e => updateRepeaterItem('faq', i, 'question', e.target.value)}
                                                    placeholder="Question"
                                                    className="font-bold"
                                                />
                                                <Textarea
                                                    value={item.answer}
                                                    onChange={e => updateRepeaterItem('faq', i, 'answer', e.target.value)}
                                                    placeholder="Answer"
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeRepeaterItem('faq', i)}>
                                                <Trash className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!content.faq || content.faq.length === 0) && <p className="text-center text-muted-foreground text-sm py-4">No questions added yet.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                    </Tabs>
                </div>
            </div>
            {/* Sticky Footer Debug or JSON view optional */}
        </div>
    );
}
