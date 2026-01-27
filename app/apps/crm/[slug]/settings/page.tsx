
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { SettingSection, SettingField, WORKSPACE_SETTINGS_SCHEMA } from '@/lib/settings-config';

export default function SettingsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [config, setConfig] = useState<SettingSection[]>([]);
    const [values, setValues] = useState<Record<string, any>>({});
    const [activeTab, setActiveTab] = useState<string>('general');

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            const response = await fetch('/api/admin/settings');
            if (response.ok) {
                const data = await response.json();

                // Re-hydrate icons from local schema (JSON strips functions/components)
                const configWithIcons = data.config.map((section: any) => {
                    const local = WORKSPACE_SETTINGS_SCHEMA.find((s) => s.id === section.id);
                    return { ...section, icon: local?.icon };
                });

                setConfig(configWithIcons);
                setValues(data.values);
                if (data.config.length > 0) setActiveTab(data.config[0].id);
            } else {
                const err = await response.json();
                throw new Error(err.error || 'Failed to load settings');
            }
        } catch (error: any) {
            console.error('Failed to fetch settings:', error);
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Settings updated successfully',
                });
                router.refresh();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update');
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (key: string, value: any) => {
        setValues(prev => ({ ...prev, [key]: value }));
    };

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, key: string) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max 2MB allowed", variant: "destructive" });
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            handleChange(key, data.url);
            toast({ title: "Success", description: "Logo uploaded successfully" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    }

    const renderField = (field: SettingField) => {
        const val = values[field.key];

        switch (field.type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                        <div className="space-y-0.5 max-w-[80%]">
                            <Label htmlFor={field.key} className="text-base font-medium">{field.label}</Label>
                            {field.description && (
                                <p className="text-sm text-muted-foreground">{field.description}</p>
                            )}
                        </div>
                        <Switch
                            id={field.key}
                            checked={val === true || val === 'true'}
                            onCheckedChange={(checked) => handleChange(field.key, checked)}
                        />
                    </div>
                );

            case 'color':
                return (
                    <div className="space-y-2 py-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors"
                                style={{ backgroundColor: val || field.defaultValue }}
                            />
                            <Input
                                id={field.key}
                                type="text"
                                value={val || ''}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                placeholder="#000000"
                                className="font-mono"
                            />
                            <input
                                type="color"
                                value={val || field.defaultValue || '#000000'}
                                onChange={(e) => handleChange(field.key, e.target.value)}
                                className="w-10 h-10 p-0 border-0 rounded overflow-hidden cursor-pointer shrink-0"
                            />
                        </div>
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-3 py-2">
                        <Label htmlFor={field.key} className="text-base">{field.label}</Label>
                        <div className="flex items-start gap-6 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50">
                            {(val) ? (
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-lg border bg-white dark:bg-black/20 flex items-center justify-center p-2">
                                        <img src={val} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleChange(field.key, '')}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-400">
                                    <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-2">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium">No Logo</span>
                                </div>
                            )}

                            <div className="flex-1 space-y-4">
                                <div>
                                    <Label htmlFor={`${field.key}-upload`} className="cursor-pointer inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white dark:bg-zinc-800 text-primary border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 h-10 px-4 py-2 w-full sm:w-auto gap-2">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                        {uploading ? 'Uploading...' : 'Upload New Image'}
                                    </Label>
                                    <Input
                                        id={`${field.key}-upload`}
                                        type="file"
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, field.key)}
                                        disabled={uploading}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Supported formats: PNG, JPG, SVG. Max size: 2MB.
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor={field.key} className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Or enter URL</Label>
                                    <Input
                                        id={field.key}
                                        value={val || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder="https://example.com/logo.png"
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default: // text, email, select
                return (
                    <div className="space-y-2 py-2">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type={field.type === 'email' ? 'email' : 'text'}
                            value={val || ''}
                            onChange={(e) => handleChange(field.key, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.validation?.required}
                        />
                        {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">Loading configuration...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pt-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
                    <p className="text-muted-foreground mt-1">Manage workspace settings and integrations.</p>
                </div>
                <div className="flex gap-2">
                    {/* Add extra actions here if needed */}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Navigation for Settings */}
                <aside className="w-full md:w-64 shrink-0 space-y-1 md:sticky md:top-6 md:h-fit">
                    <nav className="space-y-1">
                        {config.map((section) => {
                            const Icon = section.icon;
                            const isActive = activeTab === section.id;

                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveTab(section.id)}
                                    className={`group flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-[#FF5941]/10 text-[#FF5941]'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                                        }`}
                                >
                                    {Icon && (
                                        <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-[#FF5941]' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'}`} />
                                    )}
                                    {section.title}

                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF5941]" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Form Content */}
                <form onSubmit={handleSave} className="flex-1 space-y-8">
                    {config.map((section) => {
                        if (section.id !== activeTab) return null;

                        return (
                            <div key={section.id} className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <h2 className="text-xl font-semibold flex items-center gap-2">
                                            {/* <section.icon className="w-5 h-5" /> */}
                                            {section.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {section.fields.map((field) => (
                                            <div key={field.key}>
                                                {renderField(field)}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                                        <Button type="submit" disabled={saving} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </form>
            </div>
        </div>
    );
}
