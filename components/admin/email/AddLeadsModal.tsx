
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Upload, UserPlus, Database, X, FileText, Check } from 'lucide-react'
import { toast } from '@/components/toast'
import Papa from 'papaparse'
import { LeadFilter } from './LeadFilter'

interface AddLeadsModalProps {
    isOpen: boolean
    onClose: () => void
    campaignId: string
    onSuccess: (leads: any[]) => void
}

export function AddLeadsModal({ isOpen, onClose, campaignId, onSuccess }: AddLeadsModalProps) {
    const [mounted, setMounted] = useState(false)
    const [mode, setMode] = useState<'manual' | 'csv' | 'filter'>('manual')
    const [loading, setLoading] = useState(false)

    // Manual State
    const [manualEmail, setManualEmail] = useState('')

    // CSV State
    const [csvFile, setCsvFile] = useState<File | null>(null)
    const [csvPreview, setCsvPreview] = useState<string[]>([])
    const [parsing, setParsing] = useState(false)

    // Filter State
    const [filters, setFilters] = useState({
        stage: '',
        score: '',
        source: '',
        search: ''
    })
    const [previewCount, setPreviewCount] = useState<number | null>(null)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !mounted) return null

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setCsvFile(file)
        setParsing(true)

        Papa.parse(file, {
            header: true,
            complete: (results) => {
                const emails: string[] = []
                results.data.forEach((row: any) => {
                    // Try to find email in common headers
                    const email = row.Email || row.email || row.EMAIL || row.Contact || row.contact
                    if (email && email.includes('@')) {
                        emails.push(email)
                    }
                })
                setCsvPreview(emails)
                setParsing(false)
            },
            error: (error) => {
                toast({ title: 'Error', description: 'Failed to parse CSV', variant: 'destructive' })
                setParsing(false)
            }
        })
    }

    const checkFilterCount = async () => {
        setLoading(true)
        try {
            const query = new URLSearchParams(filters).toString()
            const res = await fetch(`/api/marketing/campaigns/${campaignId}/leads/preview?${query}`, {
                method: 'GET'
            })
            const data = await res.json()
            if (data.success) {
                setPreviewCount(data.count)
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to check count', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        try {
            let payload: any = { mode }

            if (mode === 'manual') {
                if (!manualEmail) return
                payload.emails = [manualEmail]
            } else if (mode === 'csv') {
                if (csvPreview.length === 0) return
                payload.emails = csvPreview
            } else if (mode === 'filter') {
                payload.filters = filters
            }

            console.log('[ADDLEADS_MODAL] Sending request:', { campaignId, payload })

            const res = await fetch(`/api/marketing/campaigns/${campaignId}/leads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()

            if (data.success) {
                const added = data.count || 0
                const skipped = data.skipped || 0

                let title = 'Import Complete'
                let variant: 'default' | 'destructive' = 'default'
                let description = ''

                if (added > 0) {
                    description = `Successfully added ${added} leads.`
                    if (skipped > 0) description += ` (${skipped} duplicates skipped)`
                } else if (skipped > 0) {
                    title = 'No New Leads'
                    description = `All ${skipped} matching leads were already in this campaign.`
                } else {
                    title = 'No Leads Found'
                    description = 'No matching leads found to import.'
                    variant = 'destructive'
                }

                toast({ title, description, variant })
                onSuccess(data.leads || [])
                onClose()
            } else {
                toast({ title: 'Error', description: data.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add leads', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-black text-xl">Add Leads to Campaign</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 border-b border-gray-100">
                    <button
                        onClick={() => setMode('manual')}
                        className={`p-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'manual' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <UserPlus className="w-4 h-4" />
                        Manual Entry
                    </button>
                    <button
                        onClick={() => setMode('csv')}
                        className={`p-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'csv' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <FileText className="w-4 h-4" />
                        CSV Import
                    </button>
                    <button
                        onClick={() => setMode('filter')}
                        className={`p-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === 'filter' ? 'text-black border-b-2 border-black bg-gray-50' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Database className="w-4 h-4" />
                        Database Filter
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {mode === 'manual' && (
                        <div className="max-w-md mx-auto space-y-4 py-8">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <h4 className="font-bold text-gray-900">Add Single Lead</h4>
                                <p className="text-sm text-gray-400">Enter email address to add one lead</p>
                            </div>
                            <input
                                className="w-full p-4 bg-gray-50 rounded-xl font-bold border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all text-center text-lg"
                                value={manualEmail}
                                onChange={e => setManualEmail(e.target.value)}
                                placeholder="name@example.com"
                                autoFocus
                            />
                        </div>
                    )}

                    {mode === 'csv' && (
                        <div className="max-w-lg mx-auto space-y-6">
                            {!csvFile ? (
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={handleCsvUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-1">Upload CSV File</h4>
                                    <p className="text-sm text-gray-400">Drag & drop or click to select</p>
                                    <p className="text-xs text-gray-300 mt-4">Required column: "Email"</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-green-600 shadow-sm">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-green-900">{csvFile.name}</h5>
                                                <p className="text-xs text-green-700">
                                                    {parsing ? 'Parsing...' : `${csvPreview.length} emails found`}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={() => { setCsvFile(null); setCsvPreview([]) }} className="p-2 hover:bg-green-100 rounded-lg text-green-700 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {csvPreview.length > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Preview</p>
                                            <div className="space-y-1">
                                                {csvPreview.slice(0, 50).map((email, i) => (
                                                    <div key={i} className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                                        {email}
                                                    </div>
                                                ))}
                                                {csvPreview.length > 50 && (
                                                    <div className="text-xs text-gray-400 italic pt-2">...and {csvPreview.length - 50} more</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'filter' && (
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                                <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-blue-900 text-sm">Target Customers Dynamically</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Select customers from your CRM based on criteria. These leads will be imported at once.
                                    </p>
                                </div>
                            </div>

                            <LeadFilter
                                filters={filters}
                                onChange={setFilters}
                            />

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <button
                                    onClick={checkFilterCount}
                                    disabled={loading}
                                    className="text-sm font-bold text-blue-600 hover:underline"
                                >
                                    {previewCount === null ? 'Check Matching Leads' : `${previewCount} Leads Match`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || (mode === 'manual' && !manualEmail) || (mode === 'csv' && csvPreview.length === 0)}
                        className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                        {mode === 'filter' ? 'Import Matching Leads' : 'Add Leads'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
