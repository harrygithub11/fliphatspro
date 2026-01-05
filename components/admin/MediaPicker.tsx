'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react';

interface MediaPickerProps {
    label: string;
    value: string | undefined;
    onChange: (url: string) => void;
    type?: 'image' | 'video';
    className?: string;
}

export function MediaPicker({ label, value, onChange, type = 'image', className }: MediaPickerProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                onChange(data.url);
            } else {
                alert('Upload failed');
            }
        } catch (error) {
            console.error(error);
            alert('Upload error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            <Label>{label}</Label>

            <div className="flex items-start gap-4">
                {/* Preview Area */}
                <div className="relative w-40 h-24 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center group shrink-0">
                    {value ? (
                        <>
                            {type === 'image' ? (
                                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <video src={value} className="w-full h-full object-cover" />
                            )}
                            <button
                                onClick={() => onChange('')}
                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </>
                    ) : (
                        <div className="text-zinc-600 flex flex-col items-center">
                            {type === 'image' ? <ImageIcon className="w-6 h-6 mb-1" /> : <Film className="w-6 h-6 mb-1" />}
                            <span className="text-[10px]">No media</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 font-mono text-xs"
                        />
                    </div>
                    <div>
                        <input
                            type="file"
                            accept={type === 'image' ? "image/*" : "video/*"}
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleUpload}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? (
                                <span className="animate-pulse">Uploading...</span>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" /> Upload New File
                                </>
                            )}
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Max size: 50MB. Supported formats: {type === 'image' ? 'JPG, PNG, WEBP' : 'MP4, WEBM'}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
