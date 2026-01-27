'use client';

import { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SectionItem {
    id: string;
    label: string;
    enabled: boolean;
}

interface SectionOrderPanelProps {
    sections: SectionItem[];
    onReorder: (newOrder: string[]) => void;
    onToggle: (role: string, enabled: boolean) => void;
}

function SortableSection({ section, onToggle }: { section: SectionItem, onToggle: (id: string, enabled: boolean) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} className={`mb-3 ${isDragging ? 'opacity-50' : ''}`}>
            <Card className="p-3 flex items-center gap-3">
                <div {...attributes} {...listeners} className="cursor-grab hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1 rounded">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                        {section.label}
                        {!section.enabled && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Switch
                        checked={section.enabled}
                        onCheckedChange={(checked) => onToggle(section.id, checked)}
                    />
                </div>
            </Card>
        </div>
    );
}

export function SectionOrderPanel({ sections, onReorder, onToggle }: SectionOrderPanelProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = sections.findIndex(s => s.id === active.id);
            const newIndex = sections.findIndex(s => s.id === over?.id);

            const newOrder = arrayMove(sections, oldIndex, newIndex).map(s => s.id);
            onReorder(newOrder);
        }
    };

    return (
        <div className="max-w-md">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Drag to reorder sections</h3>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {sections.map(section => (
                        <SortableSection
                            key={section.id}
                            section={section}
                            onToggle={onToggle}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    );
}
