'use client'

import { Textarea } from '@/components/ui/textarea'

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    height?: string
}

export default function RichTextEditor({ value, onChange, placeholder, height }: RichTextEditorProps) {
    return (
        <div className="space-y-2">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{ height: height || '300px' }}
                className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Note: Basic text support enabled. HTML tags will be preserved.</p>
        </div>
    )
}
