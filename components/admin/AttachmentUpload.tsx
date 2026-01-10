'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Paperclip, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Attachment {
    id: string
    name: string
    size: number
    type: string
    data: string // base64
}

interface AttachmentUploadProps {
    attachments: Attachment[]
    onChange: (attachments: Attachment[]) => void
    onUpload?: (attachments: Attachment[]) => void
}

export default function AttachmentUpload({ attachments, onChange, onUpload }: AttachmentUploadProps) {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        const newAttachments: Attachment[] = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const reader = new FileReader()

            const dataUrl = await new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string)
                reader.readAsDataURL(file)
            })

            newAttachments.push({
                id: Math.random().toString(36).substring(7),
                name: file.name,
                size: file.size,
                type: file.type,
                data: dataUrl
            })
        }

        const updatedAttachments = [...attachments, ...newAttachments]
        onChange(updatedAttachments)
        if (onUpload) onUpload(updatedAttachments)
    }

    const removeAttachment = (id: string) => {
        onChange(attachments.filter(a => a.id !== id))
    }

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                <Label>Attachments</Label>
            </div>

            <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
            />

            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {attachments.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-2 bg-background border px-3 py-1 rounded-full text-xs"
                        >
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => removeAttachment(file.id)}
                                className="hover:text-destructive transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
