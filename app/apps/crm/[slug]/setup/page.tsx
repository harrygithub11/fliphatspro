'use client';

import { useState, useRef, Suspense, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, FileImage, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { useSearchParams } from 'next/navigation';

// Helper Component for File Upload
const FileUpload = ({ label, accept = "image/*", onChange, value }: { label: string, accept?: string, onChange: (f: File | null) => void, value?: any }) => {
    // Determine if we have a valid uploaded value (Base64 string)
    const hasValue = value && typeof value === 'string' && value.startsWith('data:');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files ? e.target.files[0] : null;
        onChange(file);
    };

    return (
        <div className="space-y-2">
            <Label className="uppercase text-xs font-bold text-muted-foreground tracking-wider flex justify-between">
                {label}
                {hasValue && <span className="text-green-600 font-extrabold flex items-center gap-1">✅ LOADED</span>}
            </Label>
            <div className="flex gap-2 items-center">
                <Input
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-4 file:text-sm hover:file:bg-primary/90"
                />
                {hasValue && (
                    <div className="w-8 h-8 rounded border overflow-hidden bg-zinc-100 flex-shrink-0">
                        {value.startsWith('data:image') && <img src={value} alt="Preview" className="w-full h-full object-cover" />}
                    </div>
                )}
            </div>
            {value && typeof value === 'string' && !value.startsWith('data:') && (
                <p className="text-xs text-red-500">⚠️ Status: {value} (Not uploaded yet)</p>
            )}
        </div>
    );
};

function OnboardingContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('payment_id') || searchParams.get('order_id') || searchParams.get('razorpay_payment_id');
    const emailParam = searchParams.get('email');

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLeadModal, setShowLeadModal] = useState(!paymentId); // Show if no payment ID provided

    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.brandName && formData.adminName && formData.adminEmail) {
            setShowLeadModal(false);
        } else {
            alert("Please fill in all required fields to continue.");
        }
    };

    // Huge State Object for 15-Point Checklist
    const [formData, setFormData] = useState({
        paymentId: paymentId || '',
        // 1. Branding
        brandName: '',
        tagline: '',
        brandVoice: '',
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        accentColor: '#ff0000',
        headingFont: 'Inter',
        bodyFont: 'Roboto',
        logoFile: null as File | null,
        faviconFile: null as File | null,

        // 2. Home Page
        heroHeadline: '',
        heroSubheading: '',
        heroCtaText: 'Shop Now',
        heroImage1: null as File | null,
        heroImage2: null as File | null,
        heroImage3: null as File | null,
        featuredTitle: 'Best Sellers',
        // Banner
        bannerHeadline: '',
        bannerDesc: '',
        bannerCtaText: 'Learn More',
        bannerLink: '',
        bannerImage: null as File | null,
        // About Preview
        aboutPreviewTitle: '',
        aboutPreviewDesc: '',
        aboutPreviewCta: 'Our Story',
        aboutPreviewImage: null as File | null,

        // 3. Shop Page
        shopBannerImage: null as File | null,
        shopTitle: 'Shop All Products',
        shopDesc: '',
        categoryNames: '', // Comma separated
        categoryImages: null as File | null, // Simulating bulk or zip

        // 4. Product Page
        productNameFormat: '',
        productDescLength: '',
        productImagesParams: '4-6 images',
        sizeChartImage: null as File | null,
        // Features
        featureTitle1: '', featureDesc1: '',
        featureTitle2: '', featureDesc2: '',
        featureTitle3: '', featureDesc3: '',
        featureTitle4: '', featureDesc4: '',

        // 5. About Page
        aboutHeroImage: null as File | null,
        brandStoryTitle: '',
        brandStory: '',
        missionStatement: '',
        visionStatement: '',
        teamPhotos: null as File | null, // Zip/Mock

        // 6. Contact Page
        contactEmail: '',
        contactPhone: '',
        whatsappNumber: '',
        businessAddress: '',
        businessHours: '',
        facebookLink: '',
        instagramLink: '',
        twitterLink: '',
        linkedinLink: '',
        youtubeLink: '',

        // 7. Support Page
        supportEmail: '',
        supportPhone: '',
        responseTime: 'Within 24 hours',
        faqData: '', // Paste text

        // 8. Footer
        footerLogo: null as File | null,
        footerDesc: '',
        newsletterText: 'Subscribe for updates',
        copyrightText: '',

        // 9. Product Catalog
        catalogFile: null as File | null, // Excel/Sheet

        // 10. Business Config
        paymentMethods: [] as string[],
        razorpayKeyId: '',
        razorpayKeySecret: '',
        shippingProvider: '',
        shippingApiKey: '',
        shippingPickupAddress: '',
        gstNumber: '',
        taxRate: '',

        // 11. Email Config
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '',
        fromEmail: '',

        // 12. Admin User
        adminEmail: '',
        adminPass: '',
        adminName: '',
        adminPhone: '',

        // 13. SEO
        siteTitle: '',
        metaDesc: '',
        keywords: '',

        // 15. Legal
        registeredBusinessName: '',
        businessRegNumber: '',
        businessType: 'Sole Proprietorship'
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Auto-fetch payment details if payment_id exists
    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!paymentId) return;

            try {
                // If email param is already present, we might trust it, but fetching gives us more (phone etc)
                // However, fetching from API is safer/better.
                const res = await fetch(`/api/fetch-payment-details?payment_id=${paymentId}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        adminEmail: data.email || prev.adminEmail,
                        contactPhone: data.contact || prev.contactPhone, // Map to contactPhone or adminPhone?
                        adminPhone: data.contact || prev.adminPhone,
                        // If notes has brand name etc?
                        brandName: data.notes?.brand_name || prev.brandName,
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch payment details", error);
            }
        };

        fetchPaymentDetails();
    }, [paymentId]);

    // Helper to compress/resize image
    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Max dimensions
                    const MAX_WIDTH = 1000;
                    const MAX_HEIGHT = 1000;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 70%
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    // Helper to read file as Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFile = async (field: string, file: File | null) => {
        if (file) {
            try {
                let base64 = '';
                // Only compress images
                if (file.type.startsWith('image/')) {
                    base64 = await compressImage(file);
                } else {
                    // For non-images (PDF, Excel), strictly limit size or accept raw if small
                    if (file.size > 2 * 1024 * 1024) {
                        alert("File too large. Please upload files smaller than 2MB.");
                        return;
                    }
                    base64 = await fileToBase64(file);
                }

                if (!base64.startsWith('data:')) {
                    console.error("File processing result invalid:", base64.substring(0, 50));
                    alert("Error: File could not be processed correctly. Please try again.");
                    return;
                }

                setFormData(prev => ({
                    ...prev,
                    [field]: base64,
                    [`${field}_name`]: file.name
                }));
            } catch (e) {
                console.error("Error processing file", e);
                alert("Failed to process file.");
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: null,
                [`${field}_name`]: ''
            }));
        }
    };

    const togglePaymentMethod = (method: string) => {
        const current = formData.paymentMethods;
        if (current.includes(method)) {
            handleChange('paymentMethods', current.filter(m => m !== method));
        } else {
            handleChange('paymentMethods', [...current, method]);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // NOTE: We are now converting files to Base64 strings, so we can send the entire object as JSON.
            // This bypasses the need for multipart/form-data for this demo.

            /* 
               Remove any remaining raw File objects if any (legacy safety), 
               but keep the Base64 strings we just created.
            */
            const cleanData = Object.fromEntries(
                Object.entries(formData).filter(([_, v]) => !(v instanceof File))
            );

            const res = await fetch('/api/branding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cleanData),
            });

            if (res.ok) {
                setIsSubmitted(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const err = await res.json().catch(() => ({}));
                console.error("Submission Error Response:", err);
                alert(`Submission failed: ${res.statusText}\nDetails: ${err.error || err.message || JSON.stringify(err)}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred during submission. Please check your connection.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8 shadow-2xl">
                    <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Submission Received!</h1>
                    <p className="text-muted-foreground mb-6">We have received your comprehensive brand details and assets. Our team will verify the data and start building.</p>
                    <Button onClick={() => window.location.href = '/'}>Return to Home</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 py-12 px-4 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">E-Commerce Setup Checklist</h1>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                        Complete this form to provide all branding assets, content, and configurations for your new store.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-none shadow-xl overflow-hidden">
                        <CardContent className="p-0">
                            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">

                                {/* 1. BRANDING & IDENTITY */}
                                <AccordionItem value="item-1" className="bg-white">
                                    <AccordionTrigger className="px-6 py-6 text-lg font-bold hover:bg-zinc-50/50">
                                        <span className="flex items-center gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">1</span> Branding & Identity</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-8 space-y-8">
                                        <div className="grid md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Logo & Visuals</h3>
                                                <FileUpload label="Primary Logo (PNG Transparent, 500x500px)" onChange={(f) => handleFile('logoFile', f)} value={formData.logoFile} />
                                                <FileUpload label="Favicon (ICO/PNG, 32x32px)" onChange={(f) => handleFile('faviconFile', f)} value={formData.faviconFile} />
                                            </div>
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Brand Details</h3>
                                                <div className="space-y-2">
                                                    <Label>Brand Name</Label>
                                                    <Input value={formData.brandName} onChange={e => handleChange('brandName', e.target.value)} placeholder="e.g. Acme Corp" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Tagline (Max 10 words)</Label>
                                                    <Input value={formData.tagline} onChange={e => handleChange('tagline', e.target.value)} placeholder="e.g. Excellence in every stitch" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Brand Tone</Label>
                                                    <Select onValueChange={(val) => handleChange('brandVoice', val)}>
                                                        <SelectTrigger><SelectValue placeholder="Select Tone" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Professional">Professional</SelectItem>
                                                            <SelectItem value="Casual">Casual</SelectItem>
                                                            <SelectItem value="Luxury">Luxury</SelectItem>
                                                            <SelectItem value="Playful">Playful</SelectItem>
                                                            <SelectItem value="Minimalist">Minimalist</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Colors & Fonts</h3>
                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Primary (#Hex)</Label>
                                                    <div className="flex gap-2"><Input type="color" className="w-12 p-1 h-10" value={formData.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} /><Input value={formData.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} /></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Secondary (#Hex)</Label>
                                                    <div className="flex gap-2"><Input type="color" className="w-12 p-1 h-10" value={formData.secondaryColor} onChange={e => handleChange('secondaryColor', e.target.value)} /><Input value={formData.secondaryColor} onChange={e => handleChange('secondaryColor', e.target.value)} /></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Accent (#Hex)</Label>
                                                    <div className="flex gap-2"><Input type="color" className="w-12 p-1 h-10" value={formData.accentColor} onChange={e => handleChange('accentColor', e.target.value)} /><Input value={formData.accentColor} onChange={e => handleChange('accentColor', e.target.value)} /></div>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label>Heading Font</Label>
                                                    <Input value={formData.headingFont} onChange={e => handleChange('headingFont', e.target.value)} placeholder="e.g. Montserrat" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Body Font</Label>
                                                    <Input value={formData.bodyFont} onChange={e => handleChange('bodyFont', e.target.value)} placeholder="e.g. Open Sans" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 2. HOME PAGE */}
                                <AccordionItem value="item-2" className="bg-white">
                                    <AccordionTrigger className="px-6 py-6 text-lg font-bold hover:bg-zinc-50/50">
                                        <span className="flex items-center gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">2</span> Home Page Content</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-8 space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">Hero Section <span className="text-xs normal-case bg-muted px-2 py-0.5 rounded">First thing users see</span></h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <FileUpload label="Hero Image 1 (1920x1080)" onChange={f => handleFile('heroImage1', f)} value={formData.heroImage1} />
                                                <FileUpload label="Hero Image 2 (Optional)" onChange={f => handleFile('heroImage2', f)} value={formData.heroImage2} />
                                                <FileUpload label="Hero Image 3 (Optional)" onChange={f => handleFile('heroImage3', f)} value={formData.heroImage3} />
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Main Headline</Label>
                                                    <Input value={formData.heroHeadline} onChange={e => handleChange('heroHeadline', e.target.value)} maxLength={60} placeholder="e.g. New Year Collection" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Subheading</Label>
                                                    <Input value={formData.heroSubheading} onChange={e => handleChange('heroSubheading', e.target.value)} maxLength={120} placeholder="e.g. Styles for the modern era" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>CTA Button Text</Label>
                                                <Input value={formData.heroCtaText} onChange={e => handleChange('heroCtaText', e.target.value)} placeholder="e.g. Shop Now" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Promotional Banner</h3>
                                            <FileUpload label="Banner Image (1920x600 px)" onChange={f => handleFile('bannerImage', f)} value={formData.bannerImage} />
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Banner Headline</Label><Input value={formData.bannerHeadline} onChange={e => handleChange('bannerHeadline', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Banner Description</Label><Input value={formData.bannerDesc} onChange={e => handleChange('bannerDesc', e.target.value)} /></div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Banner CTA Text</Label><Input value={formData.bannerCtaText} onChange={e => handleChange('bannerCtaText', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Banner Link</Label><Input value={formData.bannerLink} onChange={e => handleChange('bannerLink', e.target.value)} /></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About Preview Section</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <FileUpload label="Section Image (800x800px)" onChange={f => handleFile('aboutPreviewImage', f)} value={formData.aboutPreviewImage} />
                                                <div className="space-y-4">
                                                    <div className="space-y-2"><Label>Title</Label><Input value={formData.aboutPreviewTitle} onChange={e => handleChange('aboutPreviewTitle', e.target.value)} /></div>
                                                    <div className="space-y-2"><Label>Short Description (200 words max)</Label><Textarea value={formData.aboutPreviewDesc} onChange={e => handleChange('aboutPreviewDesc', e.target.value)} rows={3} /></div>
                                                    <div className="space-y-2"><Label>Button Text</Label><Input value={formData.aboutPreviewCta} onChange={e => handleChange('aboutPreviewCta', e.target.value)} /></div>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 3. SHOP & PRODUCT */}
                                <AccordionItem value="item-3" className="bg-white">
                                    <AccordionTrigger className="px-6 py-6 text-lg font-bold hover:bg-zinc-50/50">
                                        <span className="flex items-center gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">3</span> Shop & Products</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-8 space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Shop Page Hero</h3>
                                            <FileUpload label="Shop Banner Image (1920x400px)" onChange={f => handleFile('shopBannerImage', f)} value={formData.shopBannerImage} />
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Page Title</Label><Input value={formData.shopTitle} onChange={e => handleChange('shopTitle', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Page Description</Label><Input value={formData.shopDesc} onChange={e => handleChange('shopDesc', e.target.value)} /></div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Categories</h3>
                                            <div className="space-y-2"><Label>Category Names (Comma Separated)</Label><Input value={formData.categoryNames} onChange={e => handleChange('categoryNames', e.target.value)} placeholder="e.g. Men, Women, Kids, Sale" /></div>
                                            <FileUpload label="Category Images (Upload Zip for all categories)" onChange={f => handleFile('categoryImages', f)} value={formData.categoryImages} />
                                        </div>
                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Feature Icons (Trust Signals)</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-1"><Label>Feature 1</Label><Input placeholder="Title" value={formData.featureTitle1} onChange={e => handleChange('featureTitle1', e.target.value)} /><Input placeholder="Desc" value={formData.featureDesc1} onChange={e => handleChange('featureDesc1', e.target.value)} /></div>
                                                <div className="space-y-1"><Label>Feature 2</Label><Input placeholder="Title" value={formData.featureTitle2} onChange={e => handleChange('featureTitle2', e.target.value)} /><Input placeholder="Desc" value={formData.featureDesc2} onChange={e => handleChange('featureDesc2', e.target.value)} /></div>
                                                <div className="space-y-1"><Label>Feature 3</Label><Input placeholder="Title" value={formData.featureTitle3} onChange={e => handleChange('featureTitle3', e.target.value)} /><Input placeholder="Desc" value={formData.featureDesc3} onChange={e => handleChange('featureDesc3', e.target.value)} /></div>
                                                <div className="space-y-1"><Label>Feature 4</Label><Input placeholder="Title" value={formData.featureTitle4} onChange={e => handleChange('featureTitle4', e.target.value)} /><Input placeholder="Desc" value={formData.featureDesc4} onChange={e => handleChange('featureDesc4', e.target.value)} /></div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 4. ESSENTIAL PAGES */}
                                <AccordionItem value="item-4" className="bg-white">
                                    <AccordionTrigger className="px-6 py-6 text-lg font-bold hover:bg-zinc-50/50">
                                        <span className="flex items-center gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">4</span> About, Contact & Support</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-8 space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About Page</h3>
                                            <FileUpload label="About Hero Image (1920x600)" onChange={f => handleFile('aboutHeroImage', f)} value={formData.aboutHeroImage} />
                                            <div className="space-y-2"><Label>Brand Story Title</Label><Input value={formData.brandStoryTitle} onChange={e => handleChange('brandStoryTitle', e.target.value)} /></div>
                                            <div className="space-y-2"><Label>Brand Story (Full Text)</Label><Textarea value={formData.brandStory} onChange={e => handleChange('brandStory', e.target.value)} rows={5} /></div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Mission Statement</Label><Textarea value={formData.missionStatement} onChange={e => handleChange('missionStatement', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Vision Statement</Label><Textarea value={formData.visionStatement} onChange={e => handleChange('visionStatement', e.target.value)} /></div>
                                            </div>
                                            <FileUpload label="Team Photos (Zip File)" onChange={f => handleFile('teamPhotos', f)} value={formData.teamPhotos} />
                                        </div>
                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact & Social</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Email</Label><Input value={formData.contactEmail} onChange={e => handleChange('contactEmail', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Phone</Label><Input value={formData.contactPhone} onChange={e => handleChange('contactPhone', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>WhatsApp</Label><Input value={formData.whatsappNumber} onChange={e => handleChange('whatsappNumber', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Address</Label><Input value={formData.businessAddress} onChange={e => handleChange('businessAddress', e.target.value)} /></div>
                                            </div>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <Input value={formData.instagramLink} onChange={e => handleChange('instagramLink', e.target.value)} placeholder="Instagram URL" />
                                                <Input value={formData.facebookLink} onChange={e => handleChange('facebookLink', e.target.value)} placeholder="Facebook URL" />
                                                <Input value={formData.linkedinLink} onChange={e => handleChange('linkedinLink', e.target.value)} placeholder="LinkedIn URL" />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Footer Content</h3>
                                            <FileUpload label="Footer Logo (Optional)" onChange={f => handleFile('footerLogo', f)} value={formData.footerLogo} />
                                            <div className="space-y-2"><Label>Footer Description</Label><Textarea value={formData.footerDesc} onChange={e => handleChange('footerDesc', e.target.value)} rows={2} /></div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Newsletter Text</Label><Input value={formData.newsletterText} onChange={e => handleChange('newsletterText', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Copyright Text</Label><Input value={formData.copyrightText} onChange={e => handleChange('copyrightText', e.target.value)} /></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Support & FAQ</h3>
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="space-y-2"><Label>Support Email</Label><Input value={formData.supportEmail} onChange={e => handleChange('supportEmail', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Support Phone</Label><Input value={formData.supportPhone} onChange={e => handleChange('supportPhone', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Response Time</Label><Input value={formData.responseTime} onChange={e => handleChange('responseTime', e.target.value)} placeholder="e.g. 24 hours" /></div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>FAQ Content (Paste text/questions here)</Label>
                                                <Textarea value={formData.faqData} onChange={e => handleChange('faqData', e.target.value)} rows={4} placeholder="Q: How long is shipping? A: 3-5 days..." />
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                                {/* 5. ADMIN & CONFIG */}
                                <AccordionItem value="item-5" className="bg-white">
                                    <AccordionTrigger className="px-6 py-6 text-lg font-bold hover:bg-zinc-50/50">
                                        <span className="flex items-center gap-3"><span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">5</span> Configuration & Catalog</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-8 space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">Product Catalog <span className="bg-yellow-100 text-yellow-800 text-xs px-2 rounded font-bold">Important</span></h3>
                                            <p className="text-sm text-muted-foreground">Upload your product sheet with Name, Price, SKU, Description, Variants, and Stock.</p>
                                            <FileUpload label="Upload Catalog (Excel/CSV)" onChange={f => handleFile('catalogFile', f)} accept=".csv, .xlsx, .xls" />
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Payment & Shipping</h3>
                                            <div className="space-y-2">
                                                <Label className="mb-2 block">Accepted Payment Methods</Label>
                                                <div className="flex gap-4 flex-wrap">
                                                    {['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'COD'].map(m => (
                                                        <div key={m} className="flex items-center gap-2">
                                                            <Checkbox id={m} checked={formData.paymentMethods.includes(m)} onCheckedChange={() => togglePaymentMethod(m)} />
                                                            <label htmlFor={m} className="text-sm cursor-pointer">{m}</label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Razorpay Key ID</Label><Input value={formData.razorpayKeyId} onChange={e => handleChange('razorpayKeyId', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Razorpay Key Secret</Label><Input value={formData.razorpayKeySecret} onChange={e => handleChange('razorpayKeySecret', e.target.value)} type="password" /></div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Shipping Provider</Label><Input value={formData.shippingProvider} onChange={e => handleChange('shippingProvider', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Shipping API Key</Label><Input value={formData.shippingApiKey} onChange={e => handleChange('shippingApiKey', e.target.value)} /></div>
                                            </div>
                                            <div className="space-y-2"><Label>Pickup Address</Label><Input value={formData.shippingPickupAddress} onChange={e => handleChange('shippingPickupAddress', e.target.value)} /></div>

                                            {/* GST & Tax */}
                                            <div className="grid md:grid-cols-2 gap-4 mt-4">
                                                <div className="space-y-2"><Label>GST Number</Label><Input value={formData.gstNumber} onChange={e => handleChange('gstNumber', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Tax Rate (%)</Label><Input value={formData.taxRate} onChange={e => handleChange('taxRate', e.target.value)} placeholder="e.g. 18" /></div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Legal & Registration</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>Registered Business Name</Label><Input value={formData.registeredBusinessName} onChange={e => handleChange('registeredBusinessName', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Registration Number (CIN/LLPIN)</Label><Input value={formData.businessRegNumber} onChange={e => handleChange('businessRegNumber', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>Business Type</Label>
                                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={formData.businessType} onChange={e => handleChange('businessType', e.target.value)}>
                                                        <option>Sole Proprietorship</option>
                                                        <option>Partnership</option>
                                                        <option>LLP</option>
                                                        <option>Private Limited</option>
                                                        <option>Public Limited</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Email Configuration (SMTP)</h3>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>SMTP Host</Label><Input value={formData.smtpHost} onChange={e => handleChange('smtpHost', e.target.value)} placeholder="smtp.gmail.com" /></div>
                                                <div className="space-y-2"><Label>SMTP Port</Label><Input value={formData.smtpPort} onChange={e => handleChange('smtpPort', e.target.value)} placeholder="587" /></div>
                                                <div className="space-y-2"><Label>SMTP User</Label><Input value={formData.smtpUser} onChange={e => handleChange('smtpUser', e.target.value)} /></div>
                                                <div className="space-y-2"><Label>SMTP Password</Label><Input value={formData.smtpPass} onChange={e => handleChange('smtpPass', e.target.value)} type="password" /></div>
                                            </div>
                                            <div className="space-y-2"><Label>From Email</Label><Input value={formData.fromEmail} onChange={e => handleChange('fromEmail', e.target.value)} /></div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t">
                                            <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">SEO Settings</h3>
                                            <div className="space-y-2"><Label>Site Title</Label><Input value={formData.siteTitle} onChange={e => handleChange('siteTitle', e.target.value)} /></div>
                                            <div className="space-y-2"><Label>Meta Description</Label><Textarea value={formData.metaDesc} onChange={e => handleChange('metaDesc', e.target.value)} rows={2} /></div>
                                            <div className="space-y-2"><Label>Keywords (Comma Separated)</Label><Input value={formData.keywords} onChange={e => handleChange('keywords', e.target.value)} /></div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>
                        </CardContent>
                        <CardFooter className="flex flex-col md:flex-row gap-4 items-center justify-between border-t p-6 bg-muted/10">
                            <div className="text-center md:text-left">
                                <p className="font-semibold">Ready to submit?</p>
                                <p className="text-sm text-muted-foreground">Ensure all files are attached and data is correct.</p>
                            </div>
                            <Button type="submit" size="lg" className="w-full md:w-auto px-10 font-bold h-12 text-lg shadow-lg hover:translate-y-[-2px] transition-all" disabled={isLoading}>
                                {isLoading ? 'Uploading...' : 'Submit Full Checklist'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
                {/* Lead Capture Modal for direct links */}
            </div> {/* Closing max-w-5xl */}

            {/* Lead Capture Modal for direct links */}
            <Dialog open={showLeadModal} onOpenChange={setShowLeadModal}>
                <DialogContent
                    className="sm:max-w-md [&>button]:hidden"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Welcome! Let's Get Started 🚀</DialogTitle>
                        <DialogDescription>
                            Tell us a bit about you and your brand so we can set up your workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLeadSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="leadName" className="font-bold">Your Name *</Label>
                            <Input
                                id="leadName"
                                placeholder="e.g. John Doe"
                                value={formData.adminName}
                                onChange={(e) => handleChange('adminName', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="brandName" className="font-bold">Brand / Business Name *</Label>
                            <Input
                                id="brandName"
                                placeholder="e.g. Urban Threads"
                                value={formData.brandName}
                                onChange={(e) => handleChange('brandName', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="leadEmail" className="font-bold">Email Address *</Label>
                            <Input
                                id="leadEmail"
                                type="email"
                                placeholder="name@company.com"
                                value={formData.adminEmail}
                                onChange={(e) => handleChange('adminEmail', e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="leadPhone">Phone Number</Label>
                            <Input
                                id="leadPhone"
                                placeholder="+91 98765 43210"
                                value={formData.adminPhone}
                                onChange={(e) => handleChange('adminPhone', e.target.value)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="submit" size="lg" className="w-full font-bold">Start Onboarding Form</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Onboarding...</div>}>
            <OnboardingContent />
        </Suspense>
    );
}
