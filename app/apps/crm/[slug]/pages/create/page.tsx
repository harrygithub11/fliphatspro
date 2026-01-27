'use client';

import { useState } from 'react';
import PageEditor from '../components/PageEditor';
import { TemplateGallery } from '@/components/admin/pages/TemplateGallery';
import { LANDING_PAGE_TEMPLATES } from '@/lib/landing-page-templates';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
    const [showGallery, setShowGallery] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const router = useRouter();

    const handleTemplateSelect = (templateId: string) => {
        if (templateId === 'blank') {
            setSelectedTemplate(null);
        } else {
            const template = LANDING_PAGE_TEMPLATES.find(t => t.id === templateId);
            if (template) {
                // We pass the content structure to the editor
                // We wrap it in an object that matches what PageEditor expects for initialData
                setSelectedTemplate({
                    content: JSON.parse(JSON.stringify(template.content)), // Deep clone to avoid mutations
                    name: `${template.name} Copy` // Suggest a name
                });
            }
        }
        setShowGallery(false);
    };

    const handleCancel = () => {
        router.back();
    };

    if (showGallery) {
        return (
            <div className="p-8 max-w-7xl mx-auto">
                <TemplateGallery onSelect={handleTemplateSelect} onCancel={handleCancel} />
            </div>
        );
    }

    return <PageEditor initialData={selectedTemplate} isEditing={false} />;
}
