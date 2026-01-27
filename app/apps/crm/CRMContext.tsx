'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

// --- Types ---
export interface Stage { id: number; value: string; label: string; color: string; display_order?: number; }
export interface Score { id: number; value: string; label: string; color: string; emoji: string; display_order?: number; }

export const COLORS = [
    { value: 'slate', class: 'bg-slate-500' },
    { value: 'red', class: 'bg-red-500' },
    { value: 'orange', class: 'bg-orange-500' },
    { value: 'amber', class: 'bg-amber-500' },
    { value: 'green', class: 'bg-green-500' },
    { value: 'blue', class: 'bg-blue-500' },
    { value: 'indigo', class: 'bg-indigo-500' },
    { value: 'purple', class: 'bg-purple-500' },
    { value: 'pink', class: 'bg-pink-500' },
];

export const COLOR_STYLES: Record<string, string> = {
    slate: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
    red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    orange: "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
    amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    green: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    purple: "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    pink: "border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
};

interface CRMContextType {
    stages: Stage[];
    scores: Score[];
    refreshMetadata: () => Promise<void>;
    // Dialog Triggers
    openAddStage: () => void;
    openManageStages: () => void;
    openAddScore: () => void;
    openManageScores: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function useCRM() {
    const context = useContext(CRMContext);
    if (!context) throw new Error('useCRM must be used within a CRMProvider');
    return context;
}

export function CRMProvider({ children }: { children: ReactNode }) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [scores, setScores] = useState<Score[]>([]);

    // Dialog States
    const [addStageOpen, setAddStageOpen] = useState(false);
    const [manageStagesOpen, setManageStagesOpen] = useState(false);
    const [addScoreOpen, setAddScoreOpen] = useState(false);
    const [manageScoresOpen, setManageScoresOpen] = useState(false);

    // Form States
    const [newStageName, setNewStageName] = useState("");
    const [newStageColor, setNewStageColor] = useState("blue");
    const [newScoreName, setNewScoreName] = useState("");
    const [newScoreColor, setNewScoreColor] = useState("blue");

    // Conflict State
    const [deleteConflict, setDeleteConflict] = useState<{ id: number, count: number, type: 'stage' | 'score', name: string } | null>(null);
    const [migrationTarget, setMigrationTarget] = useState<string>("");

    const fetchMetadata = async () => {
        try {
            const [sRes, scRes] = await Promise.all([
                fetch('/api/admin/stages?t=' + Date.now()),
                fetch('/api/admin/scores?t=' + Date.now())
            ]);

            const sData = await sRes.json();
            const scData = await scRes.json();

            if (sData.success) setStages(sData.stages);
            if (scData.success) setScores(scData.scores);
        } catch (e) { console.error("Failed to fetch CRM metadata", e); }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    // --- Actions ---

    const handleCreateStage = async () => {
        if (!newStageName) return;
        const slug = newStageName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        try {
            const res = await fetch('/api/admin/stages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: newStageName,
                    value: slug,
                    color: newStageColor,
                    display_order: stages.length
                })
            });
            if (res.ok) {
                await fetchMetadata();
                setAddStageOpen(false);
                setNewStageName("");
                setNewStageColor("blue");
            }
        } catch (e) { console.error(e); }
    };

    const handleCreateScore = async () => {
        if (!newScoreName) return;
        const slug = newScoreName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        try {
            const res = await fetch('/api/admin/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    label: newScoreName,
                    value: slug,
                    color: newScoreColor,
                    emoji: '', // No default emoji
                    display_order: scores.length
                })
            });
            if (res.ok) {
                await fetchMetadata();
                setAddScoreOpen(false);
                setNewScoreName("");
                setNewScoreColor("blue");
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteAttempt = async (type: 'stage' | 'score', id: number, name: string) => {
        try {
            const endpoint = type === 'stage' ? `/api/admin/stages/${id}` : `/api/admin/scores/${id}`;
            const res = await fetch(endpoint, { method: 'DELETE' });
            const json = await res.json();

            if (res.ok) {
                await fetchMetadata();
            } else if (json.inUse) {
                setDeleteConflict({ id, count: json.count, type, name });
                setMigrationTarget("");
            } else {
                alert(json.message || "Failed to delete");
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirmDelete = async () => {
        if (!deleteConflict || !migrationTarget) return;
        try {
            const endpoint = deleteConflict.type === 'stage' ? `/api/admin/stages/${deleteConflict.id}` : `/api/admin/scores/${deleteConflict.id}`;
            const res = await fetch(`${endpoint}?migrate_to=${migrationTarget}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchMetadata();
                setDeleteConflict(null);
            } else {
                alert("Failed to delete with migration");
            }
        } catch (e) { console.error(e); }
    };

    return (
        <CRMContext.Provider value={{
            stages,
            scores,
            refreshMetadata: fetchMetadata,
            openAddStage: () => setAddStageOpen(true),
            openManageStages: () => setManageStagesOpen(true),
            openAddScore: () => setAddScoreOpen(true),
            openManageScores: () => setManageScoresOpen(true)
        }}>
            {children}

            {/* --- Dialogs --- */}

            {/* Add Stage */}
            <Dialog open={addStageOpen} onOpenChange={setAddStageOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Custom Stage</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Stage Name</Label>
                            <Input placeholder="e.g. Follow Up" value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color Identity</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setNewStageColor(c.value)}
                                        className={`w-6 h-6 rounded-full ${c.class} ${newStageColor === c.value ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleCreateStage}>Create Stage</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Score */}
            <Dialog open={addScoreOpen} onOpenChange={setAddScoreOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Custom Score</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Score / Label Name</Label>
                            <Input placeholder="e.g. VIP" value={newScoreName} onChange={e => setNewScoreName(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Color Identity</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => setNewScoreColor(c.value)}
                                        className={`w-6 h-6 rounded-full ${c.class} ${newScoreColor === c.value ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleCreateScore}>Create Score</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Stages */}
            <Dialog open={manageStagesOpen} onOpenChange={setManageStagesOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Manage Stages</DialogTitle></DialogHeader>
                    <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                        {stages.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-${s.color || 'gray'}-500`}></div>
                                    <span className="font-medium">{s.label}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAttempt('stage', s.id, s.value)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Manage Scores */}
            <Dialog open={manageScoresOpen} onOpenChange={setManageScoresOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Manage Scores</DialogTitle></DialogHeader>
                    <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                        {scores.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs border ${COLOR_STYLES[s.color] || COLOR_STYLES['red']}`}>{s.label} {s.emoji}</span>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteAttempt('score', s.id, s.value)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conflict Resolution */}
            <Dialog open={!!deleteConflict} onOpenChange={(o) => !o && setDeleteConflict(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Cannot Delete "{deleteConflict?.name}"</DialogTitle>
                        <DialogDescription>
                            This {deleteConflict?.type} is used by <b>{deleteConflict?.count}</b> leads.
                            You must move them to another {deleteConflict?.type} before deleting.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Move all leads to:</Label>
                            <Select value={migrationTarget} onValueChange={setMigrationTarget}>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select new ${deleteConflict?.type}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {(deleteConflict?.type === 'stage' ? stages : scores)
                                        .filter(x => x.id !== deleteConflict?.id)
                                        .map(x => (
                                            <SelectItem key={x.id} value={String(x.id)}>{x.label}</SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full"
                            disabled={!migrationTarget}
                            onClick={handleConfirmDelete}
                        >
                            Move Leads & Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

        </CRMContext.Provider>
    );
}

// --- Reusable Components ---

export function StageSelect({ value, onChange, className }: { value?: string, onChange: (val: string) => void, className?: string }) {
    const { stages, openAddStage, openManageStages } = useCRM();
    const currentStage = stages.find(s => s.value === value) || { color: 'gray' };
    const styleClass = COLOR_STYLES[currentStage.color] || "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100";

    return (
        <Select
            value={value}
            onValueChange={(val) => {
                if (val === 'add_new') openAddStage();
                else if (val === 'manage_stages') openManageStages();
                else onChange(val);
            }}
        >
            <SelectTrigger className={`${className} ${styleClass} border rounded-md transition-colors`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full inline-block bg-current opacity-70`}></div>
                    <span className="truncate font-medium text-xs">
                        {stages.find(s => s.value === value)?.label || value || 'Stage'}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent>
                {stages.map(s => (
                    <SelectItem key={s.id} value={s.value}>
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full bg-${s.color || 'gray'}-500`}></div>
                            {s.label}
                        </div>
                    </SelectItem>
                ))}
                <SelectItem value="add_new" className="text-primary font-medium border-t mt-1 focus:bg-primary/10">
                    + Add Custom Stage
                </SelectItem>
                <SelectItem value="manage_stages" className="text-muted-foreground text-xs">
                    ⚙️ Manage Stages
                </SelectItem>
            </SelectContent>
        </Select>
    );
}

export function ScoreSelect({ value, onChange, className }: { value?: string, onChange: (val: string) => void, className?: string }) {
    const { scores, openAddScore, openManageScores } = useCRM();
    const currentScore = scores.find(s => s.value === value) || { color: 'gray' };

    return (
        <Select
            value={value}
            onValueChange={(val) => {
                if (val === 'add_new') openAddScore();
                else if (val === 'manage_scores') openManageScores();
                else onChange(val);
            }}
        >
            <SelectTrigger className={`${className || ''} ${COLOR_STYLES[currentScore.color] || COLOR_STYLES['red']}`}>
                <div className="flex items-center gap-1">
                    {scores.find(s => s.value === value)?.emoji || ''}
                    <span className="truncate">
                        {scores.find(s => s.value === value)?.label || value || 'Score'}
                    </span>
                </div>
            </SelectTrigger>
            <SelectContent>
                {scores.map(s => (
                    <SelectItem key={s.id} value={s.value}>
                        <span className={`px-2 py-0.5 rounded text-xs border ${COLOR_STYLES[s.color] || COLOR_STYLES['red']}`}>{s.label} {s.emoji}</span>
                    </SelectItem>
                ))}
                <SelectItem value="add_new" className="text-primary font-medium border-t mt-1 focus:bg-primary/10">
                    + Add Custom Score
                </SelectItem>
                <SelectItem value="manage_scores" className="text-muted-foreground text-xs">
                    ⚙️ Manage Scores
                </SelectItem>
            </SelectContent>
        </Select>
    );
}
