'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface AvatarUploadProps {
    currentUrl?: string | null;
    onUploadConfigured: (url: string) => void;
}

export function AvatarUpload({ currentUrl, onUploadConfigured }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({ variant: 'destructive', description: "Please upload an image file" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB
            toast({ variant: 'destructive', description: "Image size should be less than 5MB" });
            return;
        }

        // Show preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);

        const formData = new FormData();
        formData.append('current_file', file);

        try {
            const res = await fetch('/api/admin/profile/avatar', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                toast({ description: "Avatar updated successfully", className: "bg-green-500 text-white" });
                onUploadConfigured(data.url);
                // Reload the page to update avatar in header and all locations
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast({ variant: 'destructive', description: data.message || "Failed to upload avatar" });
                // Revert preview on failure
                setPreview(currentUrl || null);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', description: "Error uploading avatar" });
            setPreview(currentUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className={cn(
                    "relative w-32 h-32 rounded-full overflow-hidden border-4 cursor-pointer transition-all group",
                    dragging ? "border-primary scale-105" : "border-muted",
                    uploading ? "opacity-70" : ""
                )}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                {preview ? (
                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
                        <UserIcon className="w-12 h-12" />
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                </div>

                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <div className="text-center">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="w-4 h-4 mr-2" /> Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    Drag & drop or click to upload. Max 5MB.
                </p>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
        </div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
