'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, User, Clock, CheckCircle2, AlertCircle, Send, Plus } from 'lucide-react';
import { CustomAlert } from '@/components/ui/custom-alert';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function OrderDetailPage() {
    const params = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isZipping, setIsZipping] = useState(false);

    // Timeline Input State
    const [noteText, setNoteText] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Custom Alert State
    const [alertState, setAlertState] = useState({
        open: false,
        title: '',
        message: '',
        link: '',
        type: 'info' as 'success' | 'error' | 'info'
    });

    const handleSendNote = async () => {
        if (!noteText.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/orders/${params.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: noteText, type: 'internal_note' })
            });
            if (res.ok) {
                const newNote = await res.json();
                // Update local state to show new note immediately
                setData((prev: any) => ({
                    ...prev,
                    interactions: [newNote, ...(prev.interactions || [])]
                }));
                setNoteText('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSending(false);
        }
    };

    const sendReminder = async () => {
        if (!data?.order?.customer_email) {
            setAlertState({
                open: true,
                title: 'Missing Information',
                message: 'Customer email is required to send the reminder link.',
                link: '',
                type: 'error'
            });
            return;
        }

        setIsSending(true);
        try {
            // Use payment_id if available, otherwise use order_id for manual orders
            const identifier = data.order.razorpay_payment_id || data.order.razorpay_order_id;
            const paramName = data.order.razorpay_payment_id ? 'payment_id' : 'order_id';

            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
            const onboardingUrl = `${baseUrl}/onboarding?${paramName}=${identifier}&email=${encodeURIComponent(data.order.customer_email)}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(onboardingUrl);

            setAlertState({
                open: true,
                title: 'Onboarding Link Copied!',
                message: 'The link has been copied to your clipboard.',
                link: onboardingUrl,
                type: 'success'
            });
        } catch (err) {
            console.error(err);
            setAlertState({
                open: true,
                title: 'Error',
                message: 'Failed to copy the link to clipboard.',
                link: '',
                type: 'error'
            });
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            // ... existing data fetching
            const res = await fetch(`/api/admin/orders/${params.id}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
            setLoading(false);
        };
        fetchData();
    }, [params.id]);

    const downloadAllAssets = async () => {
        if (!data?.submission?.raw_data_json) return;
        setIsZipping(true);
        const zip = new JSZip();

        let count = 0;
        let debugLog: string[] = [];
        const uniqueUrls = new Set<string>();
        const assetsToDownload: { url: string, name: string }[] = [];
        let textSummary = `SUBMISSION DATA - Order #${data.order.razorpay_order_id}\nDate: ${new Date().toLocaleString()}\n------------------------------------------------\n\n`;

        // Parse JSON if it's a string
        let rootData = data.submission.raw_data_json;
        if (typeof rootData === 'string') {
            try {
                rootData = JSON.parse(rootData);
            } catch (e) {
                console.error("Failed to parse raw_data_json for export", e);
            }
        }

        // Recursive function to find URLs
        const findUrls = (obj: any, prefix: string = '') => {
            if (!obj) return;

            if (typeof obj === 'string') {
                // 1. Always accept data URIs (Base64 images/docs)
                if (obj.startsWith('data:')) {
                    const fieldKey = prefix || `file_${count}`;
                    if (!uniqueUrls.has(fieldKey)) {
                        // Extract extension from MIME type
                        const matches = obj.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
                        let ext = 'bin';
                        if (matches && matches[1]) {
                            const mime = matches[1];
                            if (mime.includes('image/png')) ext = 'png';
                            else if (mime.includes('image/jpeg')) ext = 'jpg';
                            else if (mime.includes('application/pdf')) ext = 'pdf';
                            else if (mime.includes('sheet')) ext = 'xlsx';
                            else if (mime.includes('excel')) ext = 'xls';
                            else if (mime.includes('csv')) ext = 'csv';
                            else if (mime.includes('zip')) ext = 'zip';
                            else ext = mime.split('/')[1];
                        }

                        let name = `${fieldKey}.${ext}`;
                        // Sanitize
                        name = name.replace(/[^a-zA-Z0-9_.-]/g, '_');

                        assetsToDownload.push({ url: obj, name });
                        uniqueUrls.add(fieldKey);
                        count++;
                    }
                    return; // Don't add data URIs to text summary
                }

                // 2. AGGRESSIVE SCANNER
                // Convert to lower to check extensions and context
                const lowVal = obj.toLowerCase();
                const lowKey = prefix.toLowerCase();

                // A. Does value look like a file? (Extension check)
                const hasExt = lowVal.match(/\.(jpeg|jpg|gif|png|webp|svg|pdf|zip|rar|mp4|mov|bmp|tiff|heic|xlsx|xls|csv|docx)$/);

                // B. Is the KEY explicitly asking for a file?
                const isFileField = lowKey.includes('image') || lowKey.includes('logo') ||
                    lowKey.includes('file') || lowKey.includes('upload') ||
                    lowKey.includes('icon') || lowKey.includes('asset') ||
                    lowKey.includes('photo') || lowKey.includes('picture') ||
                    lowKey.includes('banner') || lowKey.includes('background');

                // C. Is it a URL/Path?
                const isUrlOrPath = obj.includes('/') || obj.includes('\\') || obj.startsWith('http');

                // DECISION:
                if ((hasExt || (isFileField && isUrlOrPath)) && obj.length > 3) {
                    if (!uniqueUrls.has(obj)) {
                        uniqueUrls.add(obj);
                        let name = prefix.replace(/\./g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
                        if (hasExt) name += `.${hasExt[1]}`; // Append detected extension if robust
                        assetsToDownload.push({ url: obj, name });
                    }
                } else {
                    // It's just text content
                    // Ignore overly long base64 junk if it missed the check
                    if (obj.length < 5000) {
                        textSummary += `[${prefix}]: ${obj}\n`;
                    }
                }
                return;
            }

            if (Array.isArray(obj)) {
                obj.forEach((item, index) => findUrls(item, `${prefix}_${index + 1}`));
                return;
            }

            if (typeof obj === 'object') {
                textSummary += `\n--- ${prefix.toUpperCase()} ---\n`;
                Object.entries(obj).forEach(([key, val]) => findUrls(val, prefix ? `${prefix}_${key}` : key));
            }
        };

        findUrls(rootData);

        // Add Text Summary File
        zip.file("Submission_Text_Content.txt", textSummary);

        // Download discovered assets
        let successCount = 0;
        const assetPromises = assetsToDownload.map(async ({ url, name }) => {
            try {
                let blob: Blob;
                let ext = 'bin';

                if (url.startsWith('data:')) {
                    // Handle Base64
                    const arr = url.split(',');
                    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
                    const bstr = atob(arr[1]);
                    let n = bstr.length;
                    const u8arr = new Uint8Array(n);
                    while (n--) {
                        u8arr[n] = bstr.charCodeAt(n);
                    }
                    blob = new Blob([u8arr], { type: mime });
                    ext = mime.split('/')[1] || 'bin';
                } else {
                    // Handle HTTP URL via Proxy
                    // Ensure absolute URL if it is a local upload path
                    const absoluteUrl = url.startsWith('/') ? window.location.origin + url : url;
                    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(absoluteUrl)}`;

                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
                    blob = await response.blob();

                    // Guess extension from URL or Blob
                    const urlExt = absoluteUrl.split('.').pop()?.split(/[?#]/)[0];
                    if (urlExt && urlExt.length <= 4) {
                        ext = urlExt;
                    } else {
                        ext = blob.type.split('/')[1] || 'bin';
                    }
                }

                zip.file(`${name}.${ext}`, blob);
                successCount++;
            } catch (error) {
                console.error(`Failed to download asset ${name}:`, error);
                debugLog.push(`Failed ${name}: ${error}`);
            }
        });

        await Promise.all(assetPromises);

        if (successCount > 0) {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `Order_${data.order.razorpay_order_id}_Assets.zip`);
        } else {
            console.log("ZIP Debug:", debugLog);
            alert(`No assets found recursively.\nScanned ${uniqueUrls.size} potential URLs.\nCheck console.`);
        }
        setIsZipping(false);
    };

    if (loading) return <div className="p-8 text-center">Loading full profile...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Order not found</div>;

    const { order, submission, interactions, tasks } = data;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    {/* ... Order Title ... */}
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight">Order #{order.razorpay_order_id}</h1>
                        <Badge variant={order.status === 'paid' ? 'default' : 'destructive'} className="uppercase">
                            {order.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">Created on {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Email Customer</Button>
                    <Button>Mark as Complete</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
                {/* ... Left Column ... */}
                <div className="lg:col-span-3 space-y-6 overflow-y-auto">
                    {/* ... Customer and Tasks Cards ... */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Customer Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col items-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
                                    <User className="h-8 w-8" />
                                </div>
                                <h3 className="font-bold text-lg">{order.customer_name}</h3>
                                <p className="text-sm text-muted-foreground">Lifetime Value: ₹{order.ltv}</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <a href={`mailto:${order.customer_email}`} className="hover:underline">{order.customer_email}</a>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <a href={`tel:${order.customer_phone}`} className="hover:underline">{order.customer_phone}</a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Tasks</CardTitle>
                                <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="h-4 w-4" /></Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {tasks.map((task: any) => (
                                    <div key={task.id} className="flex items-start gap-2 p-2 rounded bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 border text-sm">
                                        <div className={`mt-0.5 w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                        <div className="flex-1">
                                            <p className="font-medium leading-none">{task.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                                        </div>
                                    </div>
                                ))}
                                {tasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">No active tasks</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* CENTER COL: Project Data (6 cols) */}
                <div className="lg:col-span-6 flex flex-col h-full overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Tabs defaultValue="onboarding" className="w-[400px]">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="onboarding">Onboarding Form</TabsTrigger>
                                        <TabsTrigger value="files">Project Files</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                {submission && (
                                    <Button size="sm" variant="secondary" onClick={downloadAllAssets} disabled={isZipping}>
                                        {isZipping ? 'Zipping...' : 'Download All Assets (ZIP)'}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-0">
                            {submission ? (
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoBlock label="Brand Name" value={submission.brand_name} />
                                        <InfoBlock label="Submission Date" value={new Date(submission.submission_date).toLocaleDateString()} />
                                    </div>

                                    <div className="border-t pt-4">
                                        <h4 className="font-semibold mb-4 text-xl">Onboarding Submission Data</h4>
                                        <div className="grid gap-4">
                                            {/* Group data before rendering */}
                                            <RecursiveDataView data={groupSubmissionData(submission.raw_data_json)} />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-zinc-50/50">
                                    <AlertCircle className="h-12 w-12 mb-4 opacity-20" />
                                    <p>No Onboarding Data Submitted Yet</p>
                                    <Button variant="link" className="mt-2" onClick={sendReminder} disabled={isSending}>
                                        {isSending ? 'Copying...' : 'Send Reminder Link'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COL: Timeline (3 cols) */}
                <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Activity Timeline</CardTitle>
                        </CardHeader>

                        {/* Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {interactions.map((log: any) => (
                                <div key={log.id} className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 last:border-0 pb-1">
                                    <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700 ring-4 ring-white dark:ring-zinc-950" />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold">{log.created_by_name || 'System'}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm font-medium">{formatTimelineMessage(log.content)}</p>
                                        <Badge variant="outline" className="w-fit text-[10px] h-5 px-1.5">{log.type}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t">
                            <div className="flex gap-2">
                                <Textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Log a note..."
                                    className="min-h-[40px] h-[40px] resize-none py-2"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendNote();
                                        }
                                    }}
                                />
                                <Button size="icon" onClick={handleSendNote} disabled={!noteText.trim() || isSending}>
                                    {isSending ? <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>

            </div>

            <CustomAlert
                open={alertState.open}
                onClose={() => setAlertState({ ...alertState, open: false })}
                title={alertState.title}
                message={alertState.message}
                link={alertState.link}
                type={alertState.type}
            />
        </div>
    );
}

// Helper: Group flat data into sections matching the form
function groupSubmissionData(flat: any) {
    if (!flat) return {};

    // Explicit whitelist of fields to show, grouped by section
    // Only these keys will be displayed. "Extra" keys in DB are ignored.
    const fieldGroups = {
        "1. Branding & Identity": [
            'brandName', 'tagline', 'brandVoice',
            'primaryColor', 'secondaryColor', 'accentColor',
            'headingFont', 'bodyFont',
            'logoFile', 'faviconFile'
        ],
        "2. Home Page Content": [
            'heroHeadline', 'heroSubheading', 'heroCtaText',
            'heroImage1', 'heroImage2', 'heroImage3',
            'featuredTitle',
            'bannerHeadline', 'bannerDesc', 'bannerCtaText', 'bannerLink', 'bannerImage',
            'aboutPreviewTitle', 'aboutPreviewDesc', 'aboutPreviewCta', 'aboutPreviewImage'
        ],
        "3. Shop & Product Settings": [
            'shopBannerImage', 'shopTitle', 'shopDesc',
            'categoryNames', 'categoryImages',
            'productNameFormat', 'productDescLength', 'productImagesParams', 'sizeChartImage',
            'catalogFile'
        ],
        "4. Features Section": [
            'featureTitle1', 'featureDesc1',
            'featureTitle2', 'featureDesc2',
            'featureTitle3', 'featureDesc3',
            'featureTitle4', 'featureDesc4'
        ],
        "5. About & Team": [
            'aboutHeroImage', 'brandStoryTitle', 'brandStory',
            'missionStatement', 'visionStatement', 'teamPhotos'
        ],
        "6. Contact & Support": [
            'contactEmail', 'contactPhone', 'whatsappNumber',
            'businessAddress', 'businessHours',
            'facebookLink', 'instagramLink', 'twitterLink', 'linkedinLink', 'youtubeLink',
            'supportEmail', 'supportPhone', 'responseTime', 'faqData'
        ],
        "7. Footer & Legal": [
            'footerLogo', 'footerDesc', 'newsletterText', 'copyrightText',
            'registeredBusinessName', 'businessRegNumber', 'businessType'
        ],
        "8. Business Configuration": [
            'paymentMethods', 'razorpayKeyId', 'razorpayKeySecret',
            'shippingProvider', 'shippingApiKey', 'shippingPickupAddress',
            'gstNumber', 'taxRate'
        ],
        "9. Email Configuration": [
            'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'fromEmail'
        ],
        "10. Admin User Setup": [
            'adminName', 'adminEmail', 'adminPass', 'adminPhone'
        ],
        "11. SEO Settings": [
            'siteTitle', 'metaDesc', 'keywords'
        ]
    };

    const sections: any = {};

    Object.entries(fieldGroups).forEach(([sectionTitle, keys]) => {
        const sectionData: any = {};
        let hasData = false;
        keys.forEach(key => {
            // Check if key exists in flat data (even if empty, we might want to show it as (Empty))
            // But if it's completely missing from DB, we treat as undefined.
            // Since User wants "A-Z nothing less", we should probably show it even if missing in DB?
            // "Admin form only have field which website form have" implies if website has it, admin show it.
            if (flat.hasOwnProperty(key)) {
                sectionData[key] = flat[key];
                hasData = true;
            } else {
                // Optional: Include it as undefined if we want to force show "Empty"
                // sectionData[key] = undefined; 
            }
        });

        if (hasData) {
            sections[sectionTitle] = sectionData;
        }
    });

    return sections;
}


function InfoBlock({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            <p className="font-medium">{value}</p>
        </div>
    );
}

// Recursive Component to render all fields including nested images
const RecursiveDataView = ({ data, label }: { data: any, label?: string }) => {
    if (data === null || data === undefined) return null;

    // 1. Handle Arrays
    if (Array.isArray(data)) {
        return (
            <div className="space-y-2 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4 my-2">
                {label && <div className="text-xs font-bold uppercase text-muted-foreground mt-2">{label} (List)</div>}
                {data.map((item, idx) => (
                    <RecursiveDataView key={idx} data={item} label={`${label} ${idx + 1}`} />
                ))}
            </div>
        );
    }

    // 2. Handle Objects
    if (typeof data === 'object') {
        return (
            <div className="space-y-2">
                {label && <div className="text-xs font-bold uppercase text-primary/80 mt-4 mb-1 border-b pb-1 inline-block">{label}</div>}
                <div className={`grid gap-3 ${label ? 'pl-2' : ''}`}>
                    {Object.entries(data).map(([key, val]: any) => (
                        <RecursiveDataView key={key} data={val} label={key.replace(/_/g, ' ')} />
                    ))}
                </div>
            </div>
        );
    }

    // 3. Handle Primitives (Strings/Numbers)
    const keyLower = (label || '').toLowerCase();
    const valStr = String(data);

    // Image Detection Logic
    const isDataUri = valStr.startsWith('data:image');
    const isUrl = valStr.startsWith('http') || valStr.startsWith('blob:');
    const hasImageExtension = valStr.match(/\.(jpeg|jpg|gif|png|webp|svg|pdf)$/i);
    // Expand keywords to match ZIP logic
    const hasImageKey = keyLower.includes('image') || keyLower.includes('logo') || keyLower.includes('icon') || keyLower.includes('photo') || keyLower.includes('banner') || keyLower.includes('background') || keyLower.includes('upload') || keyLower.includes('asset');

    const isImage = isDataUri || (isUrl && (hasImageExtension || hasImageKey));

    // Fix: If it marks as image but is just a short string/filename that isn't a URL, revert to text
    // This handles cases where value is "heroImage1" but key includes "Image"
    if (isImage && !isDataUri && !isUrl) {
        // It's not a valid link or data URI, so treat as text
        return (
            <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border text-sm break-words overflow-hidden">
                    <span className="whitespace-pre-wrap">{valStr}</span>
                    {/* Add warning that image failed to upload if it looks like it should be one */}
                    <span className="block mt-1 text-xs text-red-500 italic">
                        (Image data missing - value is text)
                    </span>
                </div>
            </div>
        );
    }

    const displayVal = (!valStr && !isImage) ? <span className="text-zinc-400 italic">(Empty)</span> : (isImage ? null : valStr);

    if (!valStr && !isImage) {
        // Show empty fields to ensure section completeness is visible 
    }

    return (
        <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded border text-sm break-words overflow-hidden">
                {isImage ? (
                    <div className="mt-1 group relative inline-block max-w-full">
                        <img src={valStr} alt={label} className="max-w-full h-auto max-h-[400px] rounded-md shadow-sm border bg-zinc-100" />
                        <div className="mt-2 flex gap-2">
                            <a href={valStr} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View Full Size</a>
                        </div>
                    </div>
                ) : (
                    <span className="whitespace-pre-wrap">{valStr}</span>
                )}
            </div>
        </div>
    );
};

// Helper: Format Timeline Content
function formatTimelineMessage(content: string) {
    try {
        const json = JSON.parse(content);
        if (json.action === 'lead_capture') return "New Lead Captured via Onboarding Form";
        if (json.action === 'status_change') return `Order status changed to ${json.newStatus}`;
        if (json.message) return json.message;
        // Fallback for unknown JSON
        return content;
    } catch (e) {
        return content;
    }
}
