'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Palette, Clock, Check, FileText, Layout, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area" // Assuming ScrollArea exists or will just use div overflow

// Full Interface matching the 15-point checklist
interface Submission {
    id: string;
    submittedAt: string;
    status: string;

    // 1. Branding
    brandName: string;
    tagline: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    headingFont: string;
    bodyFont: string;
    brandVoice: string;

    // 2. Home
    heroHeadline: string;

    // 6. Contact
    contactEmail: string;
    contactPhone: string;
    instagramLink: string;

    // Config
    shippingProvider: string;
    paymentMethods: string[];

    // Catch-all for other fields
    [key: string]: any;
}

export default function BrandSubmissionsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await fetch('/api/branding');
                if (res.ok) {
                    const data = await res.json();
                    setSubmissions(data);
                }
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, []);

    // Helper to render a data row
    const DataRow = ({ label, value }: { label: string, value: any }) => {
        if (!value) return null;
        return (
            <div className="flex flex-col py-2 border-b last:border-0">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className="font-medium text-sm mt-1">{value.toString()}</span>
            </div>
        )
    }

    // Helper to render color swatch
    const ColorRow = ({ label, value }: { label: string, value: string }) => (
        <div className="flex items-center justify-between py-2 border-b last:border-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: value }} />
                <span className="text-sm font-mono">{value}</span>
            </div>
        </div>
    )

    return (
        <div className="space-y-6 max-w-7xl mx-auto h-full">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Brand Submissions</h1>
                    <p className="text-muted-foreground">Review client brand details and assets.</p>
                </div>
            </div>

            {isLoading ? (
                <div>Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No brand submissions yet.</p>
                    <Button variant="link" onClick={() => window.open('/onboarding', '_blank')}>
                        Test the Form form here
                    </Button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {submissions.map((sub) => (
                        <Card key={sub.id} className="hover:shadow-md transition-shadow flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle>{sub.brandName || sub.businessName || 'Unnamed Brand'}</CardTitle>
                                        <p className="text-sm text-muted-foreground italic">{sub.tagline || 'No tagline'}</p>
                                    </div>
                                    <Badge variant={sub.status === 'pending' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                                        {sub.status || 'New'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm flex-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>{new Date(sub.submittedAt).toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex gap-1">
                                        {sub.primaryColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: sub.primaryColor }} title="Primary" />}
                                        {sub.secondaryColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: sub.secondaryColor }} title="Secondary" />}
                                        {sub.accentColor && <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: sub.accentColor }} title="Accent" />}
                                    </div>
                                </div>
                                {sub.contactEmail && (
                                    <div className="text-muted-foreground truncate">
                                        {sub.contactEmail}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="border-t p-4 bg-muted/5">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button className="w-full">View Full Checklist</Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-2xl">{sub.brandName}</SheetTitle>
                                            <SheetDescription>
                                                Submitted on {new Date(sub.submittedAt).toLocaleString()}
                                            </SheetDescription>
                                        </SheetHeader>

                                        <div className="space-y-8 pb-10">
                                            {/* 1. Branding */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <Palette className="h-5 w-5" /> Branding & Identity
                                                </h3>
                                                {sub.logoPreview && (
                                                    <div className="mb-4 p-4 border rounded-xl bg-zinc-50 flex flex-col items-center">
                                                        <span className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Primary Logo</span>
                                                        <img src={sub.logoPreview} alt="Brand Logo" className="max-h-24 object-contain" />
                                                    </div>
                                                )}
                                                <div className="grid gap-1 pl-2">
                                                    {sub.primaryColor && <ColorRow label="Primary Color" value={sub.primaryColor} />}
                                                    {sub.secondaryColor && <ColorRow label="Secondary Color" value={sub.secondaryColor} />}
                                                    {sub.accentColor && <ColorRow label="Accent Color" value={sub.accentColor} />}
                                                    <DataRow label="Heading Font" value={sub.headingFont} />
                                                    <DataRow label="Body Font" value={sub.bodyFont} />
                                                    <DataRow label="Tone of Voice" value={sub.brandVoice} />
                                                </div>
                                            </section>

                                            {/* Assets Section - Displaying Captured Filenames */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <FileText className="h-5 w-5" /> Attached Assets
                                                </h3>
                                                <div className="grid gap-2 pl-2">
                                                    {[
                                                        { label: 'Favicon', key: 'faviconFileName' },
                                                        { label: 'Hero Image 1', key: 'heroImage1Name' },
                                                        { label: 'Hero Image 2', key: 'heroImage2Name' },
                                                        { label: 'Hero Image 3', key: 'heroImage3Name' },
                                                        { label: 'Banner Image', key: 'bannerImageName' },
                                                        { label: 'Shop Banner', key: 'shopBannerImageName' },
                                                        { label: 'About Hero', key: 'aboutHeroImageName' },
                                                        { label: 'Team Photos', key: 'teamPhotosName' },
                                                        { label: 'Catalog File', key: 'catalogFileName' },
                                                    ].map((item) => {
                                                        const fileName = sub[item.key];
                                                        if (!fileName) return null;
                                                        return (
                                                            <div key={item.key} className="flex justify-between items-center py-2 px-3 bg-muted/20 rounded-md border">
                                                                <span className="text-sm font-medium">{item.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{fileName}</span>
                                                                    <Badge variant="outline" className="text-[10px]">Attached</Badge>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </section>

                                            {/* 2. Home Page */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <Layout className="h-5 w-5" /> Home Page Content
                                                </h3>
                                                <div className="grid gap-1 pl-2">
                                                    <DataRow label="Hero Headline" value={sub.heroHeadline} />
                                                    <DataRow label="Hero Subheading" value={sub.heroSubheading} />
                                                    <DataRow label="CTA Text" value={sub.heroCtaText} />
                                                    <DataRow label="Banner Headline" value={sub.bannerHeadline} />
                                                    <DataRow label="Banner Link" value={sub.bannerLink} />
                                                </div>
                                            </section>

                                            {/* 3. Shop & Product */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <ShoppingBag className="h-5 w-5" /> Shop & Config
                                                </h3>
                                                <div className="grid gap-1 pl-2">
                                                    <DataRow label="Shop Title" value={sub.shopTitle} />
                                                    <DataRow label="Categories" value={sub.categoryNames} />
                                                </div>
                                            </section>

                                            {/* 4. Contact & Legal */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <FileText className="h-5 w-5" /> Contact Details
                                                </h3>
                                                <div className="grid gap-1 pl-2">
                                                    <DataRow label="Email" value={sub.contactEmail} />
                                                    <DataRow label="Phone" value={sub.contactPhone} />
                                                    <DataRow label="Address" value={sub.businessAddress} />
                                                    <DataRow label="Instagram" value={sub.instagramLink} />
                                                </div>
                                            </section>

                                            {/* 5. Shipping & Payment */}
                                            <section className="space-y-3">
                                                <h3 className="flex items-center gap-2 font-bold text-lg text-primary border-b pb-2">
                                                    <Truck className="h-5 w-5" /> Logistics
                                                </h3>
                                                <div className="grid gap-1 pl-2">
                                                    <DataRow label="Shipping Provider" value={sub.shippingProvider} />
                                                    <DataRow label="Payment Methods" value={Array.isArray(sub.paymentMethods) ? sub.paymentMethods.join(', ') : sub.paymentMethods} />
                                                    <DataRow label="Razorpay Key" value={sub.razorpayKeyId} />
                                                    <DataRow label="GST Number" value={sub.gstNumber} />
                                                </div>
                                            </section>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
