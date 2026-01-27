import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Switch } from "@/components/ui/switch"
import {
    Play,
    Plus,
    Loader2,
    Clock,
    Mail,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Trash2,
    Save,
    Send,
    Users,
    UserPlus,
    PlayCircle
} from "lucide-react"
import { AddLeadsModal } from './AddLeadsModal'

interface CampaignStep {
    id: string
    type: 'email' | 'delay'
    subject?: string
    htmlBody?: string
    delaySeconds?: number
    stepOrder: number
}

interface CampaignLead {
    id: string
    leadEmail: string
    status: string
    joinedAt: string
    currentStep: number
    nextStepDue?: string
}

interface Campaign {
    id: string
    name: string
    status: string
    type: string
}

interface CampaignLog {
    id: number
    type: string
    message: string
    created_at: string
    leadEmail: string
}

interface CampaignDetailViewProps {
    campaign: Campaign
    onBack: () => void
    initialTab?: 'sequence' | 'leads' | 'history'
    onTabChange?: (tab: 'sequence' | 'leads' | 'history') => void
}

export function CampaignDetailView({ campaign, onBack, initialTab = 'sequence', onTabChange }: CampaignDetailViewProps) {
    const [activeTab, setActiveTab] = useState<'sequence' | 'leads' | 'history'>(initialTab)
    const { toast } = useToast()

    // Notify parent of tab changes
    const handleTabChange = (tab: 'sequence' | 'leads' | 'history') => {
        setActiveTab(tab)
        onTabChange?.(tab)
    }

    const [status, setStatus] = useState(campaign.status)

    const handleStatusChange = async (checked: boolean) => {
        const newStatus = checked ? 'active' : 'draft'
        const oldStatus = status
        setStatus(newStatus)
        try {
            await fetch(`/api/marketing/campaigns/${campaign.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            toast({ title: 'Status Updated', description: `Campaign is now ${newStatus}` })
        } catch (e) {
            setStatus(oldStatus)
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
        }
    }

    // Steps State
    const [steps, setSteps] = useState<CampaignStep[]>([])
    const [loadingSteps, setLoadingSteps] = useState(false)
    const [isAddingStep, setIsAddingStep] = useState(false)
    const [newStepType, setNewStepType] = useState<'email' | 'delay'>('email')
    const [isRunning, setIsRunning] = useState(false)

    // Leads State
    const [leads, setLeads] = useState<CampaignLead[]>([])
    const [loadingLeads, setLoadingLeads] = useState(false)
    const [isAddingLead, setIsAddingLead] = useState(false)
    const [newLeadEmail, setNewLeadEmail] = useState('')

    // Bulk Selection State
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    // Logs State
    const [logs, setLogs] = useState<CampaignLog[]>([])

    // New Step Form State
    const [editingStepId, setEditingStepId] = useState<string | null>(null)
    const [newStep, setNewStep] = useState({
        subject: '',
        htmlBody: '',
        delaySeconds: 24,
        delayUnit: 'hours'
    })

    useEffect(() => {
        loadSteps()
        loadLeads()
        loadLogs()
    }, [campaign.id])

    const loadLogs = async () => {
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/logs`)
            const data = await res.json()
            if (data.success) {
                setLogs(data.logs)
            }
        } catch (e) {
            console.error('Failed to load logs', e)
        }
    }

    const loadSteps = async () => {
        setLoadingSteps(true)
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/steps`)
            const data = await res.json()
            if (data.success) {
                setSteps(data.steps)
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load steps', variant: 'destructive' })
        } finally {
            setLoadingSteps(false)
        }
    }

    const loadLeads = async () => {
        setLoadingLeads(true)
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/leads`)
            const data = await res.json()
            if (data.success) {
                setLeads(data.leads)
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to load leads', variant: 'destructive' })
        } finally {
            setLoadingLeads(false)
        }
    }

    const calculateSeconds = () => {
        const val = newStep.delaySeconds
        if (newStep.delayUnit === 'minutes') return val * 60
        if (newStep.delayUnit === 'hours') return val * 3600
        if (newStep.delayUnit === 'days') return val * 86400
        return val
    }

    const handleAddStep = async () => {
        try {
            const payload = {
                id: editingStepId, // Include ID if editing
                type: newStepType,
                stepOrder: editingStepId ? undefined : steps.length + 1, // Keep order if editing
                subject: newStepType === 'email' ? newStep.subject : undefined,
                htmlBody: newStepType === 'email' ? newStep.htmlBody : undefined,
                delaySeconds: newStepType === 'delay' ? calculateSeconds() : 0
            }

            const method = editingStepId ? 'PUT' : 'POST'
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/steps`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: 'Success', description: editingStepId ? 'Step updated' : 'Step added' })
                if (editingStepId) {
                    setSteps(steps.map(s => s.id === editingStepId ? { ...s, ...payload, id: s.id, stepOrder: s.stepOrder } : s))
                } else {
                    setSteps([...steps, data.step])
                }
                setIsAddingStep(false)
                setEditingStepId(null)
                setNewStep({ subject: '', htmlBody: '', delaySeconds: 24, delayUnit: 'hours' })
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to save step', variant: 'destructive' })
        }
    }

    const openEditStep = (step: CampaignStep) => {
        setEditingStepId(step.id)
        setNewStepType(step.type)
        if (step.type === 'email') {
            setNewStep({
                ...newStep,
                subject: step.subject || '',
                htmlBody: step.htmlBody || ''
            })
        } else {
            // Reverse calc
            let seconds = step.delaySeconds || 0
            let unit = 'seconds'
            if (seconds >= 86400 && seconds % 86400 === 0) { unit = 'days'; seconds /= 86400 }
            else if (seconds >= 3600 && seconds % 3600 === 0) { unit = 'hours'; seconds /= 3600 }
            else if (seconds >= 60 && seconds % 60 === 0) { unit = 'minutes'; seconds /= 60 }

            setNewStep({
                ...newStep,
                delaySeconds: seconds,
                delayUnit: unit
            })
        }
        setIsAddingStep(true)
    }

    const handleAddLead = async () => {
        if (!newLeadEmail) return
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newLeadEmail })
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: 'Success', description: 'Lead added to campaign' })
                setLeads([data.lead, ...leads])
                setIsAddingLead(false)
                setNewLeadEmail('')
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add lead', variant: 'destructive' })
        }
    }

    // Run Campaign Handler
    const runCampaign = async (force: boolean = false) => {
        if (!campaign) return

        setIsRunning(true)
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/run`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ force })
            })
            const data = await res.json()

            if (data.success) {
                if (data.processed === 0 && !force) {
                    toast({
                        title: 'Campaign Checked',
                        description: 'No leads ready. They are waiting for delays.',
                        variant: 'default',
                        action: (
                            <ToastAction altText="Force Run" onClick={() => runCampaign(true)}>
                                Force Run
                            </ToastAction>
                        ),
                    })
                } else {
                    toast({
                        title: 'Campaign Executed!',
                        description: data.message
                    })
                }
                // Reload leads to show updated status
                loadLeads()
            } else {
                toast({
                    title: 'Error Running Campaign',
                    description: data.error || 'Unknown error occurred',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Run campaign error:', error)
            toast({
                title: 'Error',
                description: 'Failed to run campaign. Check console.',
                variant: 'destructive'
            })
        } finally {
            setIsRunning(false)
        }
    }

    const resetCampaign = async () => {
        if (!confirm('Reset all leads to Step 1? This allows re-testing.')) return

        setIsRunning(true)
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/reset`, {
                method: 'POST'
            })
            const data = await res.json()

            if (data.success) {
                toast({
                    title: 'Campaign Reset',
                    description: 'All leads reset to start. Ready to run again.'
                })
                loadLeads()
            } else {
                toast({
                    title: 'Error',
                    description: 'Failed to reset campaign',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Reset error:', error)
            toast({
                title: 'Error',
                description: 'Failed to reset campaign',
                variant: 'destructive'
            })
        } finally {
            setIsRunning(false)
        }
    }

    const formatDelay = (seconds: number) => {
        if (seconds >= 86400) return `${(seconds / 86400).toFixed(1)} Days`
        if (seconds >= 3600) return `${(seconds / 3600).toFixed(1)} Hours`
        return `${(seconds / 60).toFixed(0)} Mins`
    }

    // Bulk Selection Handlers
    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(leads.map(l => l.id))
        }
    }

    const toggleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(lid => lid !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    const handleBulkDelete = async () => {
        if (!selectedLeads.length) return
        if (!confirm(`Delete ${selectedLeads.length} leads from this campaign?`)) return

        setIsBulkDeleting(true)
        try {
            const res = await fetch(`/api/marketing/campaigns/${campaign.id}/leads/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadIds: selectedLeads })
            })
            const data = await res.json()
            if (data.success) {
                toast({ title: 'Success', description: `Deleted ${selectedLeads.length} leads` })
                setLeads(leads.filter(l => !selectedLeads.includes(l.id)))
                setSelectedLeads([])
            } else {
                toast({ title: 'Error', description: data.error || 'Delete failed', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to delete leads', variant: 'destructive' })
        } finally {
            setIsBulkDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-500 hover:text-black font-bold text-sm transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Campaigns
            </button>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">{campaign.name}</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => handleTabChange('sequence')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'sequence' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Sequence
                                </button>
                                <button
                                    onClick={() => handleTabChange('leads')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'leads' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    Leads ({leads.length})
                                </button>
                                <button
                                    onClick={() => handleTabChange('history')}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-900'}`}
                                >
                                    History
                                </button>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'sequence' ? (
                        <div className="flex gap-3">
                            <button
                                onClick={() => runCampaign(false)}
                                disabled={isRunning || leads.length === 0 || steps.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isRunning ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Running...</>
                                ) : (
                                    <><PlayCircle className="w-4 h-4" /> Run Campaign</>
                                )}
                            </button>

                            <button
                                onClick={() => runCampaign(true)}
                                disabled={isRunning || leads.length === 0 || steps.length === 0}
                                title="Force run next step ignoring delays"
                                className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Clock className="w-4 h-4" /> Force Run
                            </button>

                            <button
                                onClick={() => { setIsAddingStep(true); setNewStepType('email'); setEditingStepId(null); setNewStep({ subject: '', htmlBody: '', delaySeconds: 24, delayUnit: 'hours' }); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                <Mail className="w-4 h-4" />
                                Add Email
                            </button>
                            <button
                                onClick={() => { setIsAddingStep(true); setNewStepType('delay'); setEditingStepId(null); setNewStep({ subject: '', htmlBody: '', delaySeconds: 24, delayUnit: 'hours' }); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:bg-gray-50 hover:text-gray-700 transition-all"
                            >
                                <Clock className="w-4 h-4" />
                                Add Delay
                            </button>

                            <button
                                onClick={resetCampaign}
                                disabled={isRunning || leads.length === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:border-red-300 transition-all ml-auto"
                            >
                                <AlertCircle className="w-4 h-4" />
                                Reset Progress
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAddingLead(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                        >
                            <UserPlus className="w-4 h-4" />
                            Add Lead
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="pb-20">
                {activeTab === 'sequence' && (
                    <div className="relative max-w-3xl mx-auto py-8">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 -z-10"></div>
                        {steps.map((step, index) => (
                            <div key={step.id} className="mb-8 relative z-10">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="bg-white px-4 py-1 rounded-full border border-gray-200 text-xs font-bold uppercase text-gray-400 shadow-sm">
                                        Step {index + 1}
                                    </div>
                                </div>
                                {step.type === 'email' ? (
                                    <div
                                        onClick={(e) => { e.stopPropagation(); openEditStep(step); }}
                                        className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group hover:shadow-md transition-all cursor-pointer hover:border-blue-300 active:scale-[0.99]"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{step.subject || '(No Subject)'}</h4>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{step.htmlBody?.replace(/<[^>]*>?/gm, "") || 'No content'}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 rounded-lg px-2 py-1 text-xs font-bold text-gray-600">
                                                Edit
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-center">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); openEditStep(step); }}
                                            className="bg-white px-6 py-3 rounded-full border border-dashed border-gray-300 flex items-center gap-2 text-sm font-bold text-gray-600 cursor-pointer hover:bg-white hover:border-amber-400 hover:text-amber-600 transition-all active:scale-[0.99]"
                                        >
                                            <Clock className="w-4 h-4 text-gray-400 group-hover:text-amber-500" />
                                            Wait {formatDelay(step.delaySeconds || 0)}
                                            <span className="text-[10px] ml-2 opacity-0 hover:opacity-100">(Edit)</span>
                                        </div>
                                    </div>
                                )}
                                {index < steps.length - 1 && <div className="flex justify-center mt-4 text-gray-300">↓</div>}
                            </div>
                        ))}
                        {steps.length === 0 && (
                            <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">No steps defined. Add an email to start.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leads' && (
                    <>
                        {/* Bulk Action Bar */}
                        {selectedLeads.length > 0 && (
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-zinc-700">
                                <div className="flex items-center gap-3 border-r border-zinc-700 pr-6">
                                    <span className="font-bold text-sm bg-white text-black px-2 py-0.5 rounded-full">{selectedLeads.length}</span>
                                    <span className="text-sm font-medium">Selected</span>
                                </div>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isBulkDeleting}
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold text-sm disabled:opacity-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isBulkDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                                <button
                                    onClick={() => setSelectedLeads([])}
                                    className="text-zinc-500 hover:text-white font-bold h-8 w-8 rounded-full flex items-center justify-center"
                                >
                                    &times;
                                </button>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-4 w-[40px]">
                                            <input
                                                type="checkbox"
                                                checked={leads.length > 0 && selectedLeads.length === leads.length}
                                                onChange={toggleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                            />
                                        </th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Step Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Step</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {leads.map(lead => (
                                        <tr key={lead.id} className={`hover:bg-gray-50 ${selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onChange={() => toggleSelectLead(lead.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                <Link href={`leads?search=${lead.leadEmail}`} className="hover:text-blue-600 hover:underline">
                                                    {lead.leadEmail}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${lead.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {lead.nextStepDue ? new Date(lead.nextStepDue).toLocaleString() : '-'}
                                                {lead.status === 'active' && lead.nextStepDue && new Date(lead.nextStepDue) > new Date() && (
                                                    <span className="ml-2 text-xs text-orange-500 font-medium">(Waiting)</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">Step {lead.currentStep + 1}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{new Date(lead.joinedAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                    {leads.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No leads in this campaign yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Activity Log</h3>
                            <button onClick={loadLogs} className="text-sm text-blue-600 font-bold hover:underline">Refresh</button>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-3 px-6 font-bold text-xs text-gray-500 uppercase">Time</th>
                                    <th className="text-left py-3 px-6 font-bold text-xs text-gray-500 uppercase">Event</th>
                                    <th className="text-left py-3 px-6 font-bold text-xs text-gray-500 uppercase">Lead</th>
                                    <th className="text-left py-3 px-6 font-bold text-xs text-gray-500 uppercase">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-gray-400">No activity recorded yet.</td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-6 text-sm text-gray-500 font-mono whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                                                ${log.type === 'EMAIL_SENT' ? 'bg-green-100 text-green-700' :
                                                    log.type === 'DELAY_PROCESSED' ? 'bg-blue-100 text-blue-700' :
                                                        log.type === 'DELAY_STARTED' ? 'bg-gray-100 text-gray-600' :
                                                            log.type === 'ERROR' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {log.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-sm font-bold text-gray-700">
                                            {log.leadEmail ? (
                                                <Link href={`leads?search=${log.leadEmail}`} className="hover:text-blue-600 hover:underline">
                                                    {log.leadEmail}
                                                </Link>
                                            ) : 'System'}
                                        </td>
                                        <td className="py-3 px-6 text-sm text-gray-600 truncate max-w-xs" title={log.message}>{log.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-4 bg-gray-50 text-xs text-gray-400 text-center">
                            Showing last 100 events. For upcoming schedule check the Leads tab.
                        </div>
                    </div>
                )}
            </div>

            {/* ADD STEP MODAL */}
            {isAddingStep && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200 overflow-hidden">
                        {/* Header with Gradient */}
                        <div className="shrink-0 p-8 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white rounded-t-3xl">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm ring-1 ring-black/5 ${newStepType === 'email' ? 'bg-[#FF5941]/10 text-[#FF5941]' : 'bg-amber-50 text-amber-600'}`}>
                                {newStepType === 'email' ? <Mail className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                            </div>
                            <h3 className="font-black text-2xl text-gray-900 tracking-tight">
                                {editingStepId ? 'Edit Step' : (newStepType === 'email' ? 'Compose Email Step' : 'Add Time Delay')}
                            </h3>
                            <p className="text-gray-500 font-medium text-sm mt-1">
                                {newStepType === 'email'
                                    ? 'Design the email content for this sequence step.'
                                    : 'Set a waiting period before the next action.'}
                            </p>
                        </div>

                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            {newStepType === 'email' ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-gray-500 ml-1">Subject Line</label>
                                        <input
                                            className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none shadow-sm"
                                            value={newStep.subject}
                                            onChange={e => setNewStep({ ...newStep, subject: e.target.value })}
                                            placeholder="e.g. Welcome to the family! 👋"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-gray-500 ml-1">Email Body (HTML)</label>
                                        <textarea
                                            className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none min-h-[160px] resize-none leading-relaxed shadow-sm"
                                            value={newStep.htmlBody}
                                            onChange={e => setNewStep({ ...newStep, htmlBody: e.target.value })}
                                            placeholder="<p>Hello {{name}},</p>..."
                                        />
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="text-[10px] text-gray-400 font-bold">Insert:</span>
                                            {['name', 'firstName', 'lastName', 'email', 'company', 'domain'].map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => setNewStep({ ...newStep, htmlBody: newStep.htmlBody + `{{${v}}}` })}
                                                    className="px-2 py-0.5 bg-gray-100 hover:bg-[#FF5941]/10 hover:text-[#FF5941] text-gray-600 text-[10px] font-bold rounded-md transition-all cursor-pointer"
                                                >
                                                    {`{{${v}}}`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-gray-500 ml-1">Wait Duration</label>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                className="w-full p-4 bg-white/40 border border-white/60 rounded-2xl font-black text-2xl text-gray-900 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none text-center shadow-sm"
                                                value={newStep.delaySeconds}
                                                onChange={e => setNewStep({ ...newStep, delaySeconds: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <select
                                                className="w-full h-full p-4 bg-gray-50/40 border border-white/60 rounded-2xl font-bold text-gray-700 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none appearance-none shadow-sm"
                                                value={newStep.delayUnit}
                                                onChange={e => setNewStep({ ...newStep, delayUnit: e.target.value })}
                                            >
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                                <option value="days">Days</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 p-6 bg-white/40 border-t border-white/20 flex justify-end gap-3 backdrop-blur-xl rounded-b-3xl">
                            <button
                                onClick={() => setIsAddingStep(false)}
                                className="px-6 py-2.5 text-gray-500 font-bold hover:bg-white/50 rounded-xl transition-all hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddStep}
                                className={`px-8 py-2.5 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all flex items-center gap-2 ${newStepType === 'email' ? 'bg-[#FF5941] hover:bg-[#e54d38]' : 'bg-amber-600 hover:bg-amber-700'}`}
                            >
                                {newStepType === 'email' ? <Mail className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                {editingStepId ? 'Update Step' : (newStepType === 'email' ? 'Save Email' : 'Set Delay')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ADD LEADS MODAL */}
            <AddLeadsModal
                isOpen={isAddingLead}
                onClose={() => setIsAddingLead(false)}
                campaignId={campaign.id}
                onSuccess={(newLeads) => setLeads([...newLeads, ...leads])}
            />
        </div>
    )
}
