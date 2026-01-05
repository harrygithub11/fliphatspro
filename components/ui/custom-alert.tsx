import { useState, useEffect } from 'react';
import { CheckCircle2, Copy, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomAlertProps {
    open: boolean;
    onClose: () => void;
    title: string;
    message: string;
    link?: string;
    type?: 'success' | 'error' | 'info';
}

export function CustomAlert({ open, onClose, title, message, link, type = 'info' }: CustomAlertProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (link) {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-base pt-2">
                        {message}
                    </DialogDescription>
                </DialogHeader>

                {link && (
                    <div className="space-y-3 py-4">
                        <div className="flex gap-2">
                            <Input
                                value={link}
                                readOnly
                                className="font-mono text-xs bg-zinc-50 dark:bg-zinc-900"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Send this link to the customer via email or WhatsApp
                        </p>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Got it
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
