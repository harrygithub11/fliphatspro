
import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Plus, Megaphone, BarChart3, Users, MoreHorizontal, Loader2, CheckCircle2,
    PlayCircle,
    PauseCircle,
    Send,
    Search,
    Filter
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from '@/components/toast'
import { CampaignDetailView } from './CampaignDetailView'

interface Campaign {
    id: string
    name: string
    status: string
    type: string
    sentCount: number
    openCount: number
    replyCount: number
    createdAt: string
}

interface MarketingViewProps {
    accounts: any[]
    searchQuery?: string
}

export function MarketingView({ accounts, searchQuery = '' }: MarketingViewProps) {
    const searchParams = useSearchParams()
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [pendingCampaignId, setPendingCampaignId] = useState<string | null>(searchParams.get('campaign'))
    const initialSubTab = searchParams.get('subtab') as 'sequence' | 'leads' | null

    // New Campaign Form
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        description: '',
        type: 'sequence',
        accountId: accounts.length > 0 ? accounts[0].id : ''
    })

    // Local accounts state to ensure dynamic data
    const [localAccounts, setLocalAccounts] = useState<any[]>(accounts)

    useEffect(() => {
        // Fetch accounts dynamically to ensure we have the latest list
        const fetchAccounts = async () => {
            try {
                const res = await fetch('/api/email-system/accounts')
                const data = await res.json()
                if (data.accounts) {
                    setLocalAccounts(data.accounts)
                    // Auto-select first account if not set
                    if (!newCampaign.accountId && data.accounts.length > 0) {
                        setNewCampaign(prev => ({ ...prev, accountId: data.accounts[0].id }))
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dynamic accounts:", error)
            }
        }
        fetchAccounts()
    }, [])

    // Also update if props change (fallback)
    useEffect(() => {
        if (accounts.length > 0) {
            // We prioritize the dynamic fetch, but this is a safety net
            if (localAccounts.length === 0) setLocalAccounts(accounts)

            if (!newCampaign.accountId) {
                setNewCampaign(prev => ({ ...prev, accountId: accounts[0].id }))
            }
        }
    }, [accounts])

    useEffect(() => {
        if (!selectedCampaign) {
            loadCampaigns()
        }
    }, [selectedCampaign])

    // Auto-select campaign from URL after campaigns load
    useEffect(() => {
        if (pendingCampaignId && campaigns.length > 0 && !selectedCampaign) {
            const campaign = campaigns.find(c => c.id === pendingCampaignId)
            if (campaign) {
                setSelectedCampaign(campaign)
            }
            setPendingCampaignId(null) // Clear pending
        }
    }, [campaigns, pendingCampaignId, selectedCampaign])

    // Filter campaigns based on search query
    const filteredCampaigns = campaigns.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Helper to update URL when campaign is selected/deselected
    const updateCampaignUrl = (campaignId: string | null, subtab?: string) => {
        const url = new URL(window.location.href)
        if (campaignId) {
            url.searchParams.set('campaign', campaignId)
            if (subtab) {
                url.searchParams.set('subtab', subtab)
            }
        } else {
            url.searchParams.delete('campaign')
            url.searchParams.delete('subtab')
        }
        window.history.replaceState({}, '', url.toString())
    }

    // Wrapper to select campaign and update URL
    const handleSelectCampaign = (campaign: Campaign) => {
        setSelectedCampaign(campaign)
        updateCampaignUrl(campaign.id)
    }

    // Wrapper to go back to campaigns list
    const handleBackToCampaigns = () => {
        setSelectedCampaign(null)
        updateCampaignUrl(null)
    }

    const loadCampaigns = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/marketing/campaigns')
            const data = await res.json()
            if (data.success) {
                setCampaigns(data.campaigns)
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'Failed to load campaigns', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async () => {
        if (!newCampaign.name || !newCampaign.accountId) {
            toast({ title: 'Validation', description: 'Name and Account are required', variant: 'destructive' })
            return
        }

        try {
            const res = await fetch('/api/marketing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCampaign)
            })
            const data = await res.json()

            if (data.success) {
                toast({ title: 'Success', description: 'Campaign created' })
                setIsCreating(false)
                loadCampaigns()
                setNewCampaign({ ...newCampaign, name: '' })
            } else {
                // If error suggests table missing, warn user
                if (data.error && data.error.includes('Table')) {
                    toast({
                        title: 'Database Setup Required',
                        description: 'Please run the marketing SQL script to set up tables.',
                        variant: 'destructive'
                    })
                } else {
                    toast({ title: 'Error', description: data.error, variant: 'destructive' })
                }
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Network error', variant: 'destructive' })
        }
    }

    const handleStatusUpdate = async (e: React.MouseEvent, id: string, status: string) => {
        e.stopPropagation()

        // Optimistic Update
        setCampaigns(campaigns.map(c => c.id === id ? { ...c, status } : c))

        try {
            await fetch(`/api/marketing/campaigns/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })
            toast({ title: 'Status Updated', description: `Campaign is now ${status}` })
        } catch (err) {
            loadCampaigns() // Revert on error
            toast({ title: 'Error', description: 'Update failed', variant: 'destructive' })
        }
    }

    if (selectedCampaign) {
        return (
            <CampaignDetailView
                campaign={selectedCampaign}
                onBack={handleBackToCampaigns}
                initialTab={initialSubTab || 'sequence'}
                onTabChange={(tab) => updateCampaignUrl(selectedCampaign.id, tab)}
            />
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Marketing Campaigns</h2>
                    <p className="text-gray-500 text-sm font-medium mt-1">Manage email blasts and automated sequences</p>
                </div>
                {/* Search removed from here (moved to top bar). Filters/Create kept. */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 font-bold text-sm text-gray-700 transition-colors">
                        <Filter className="w-4 h-4" /> Filters
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 font-bold text-sm shadow-sm transition-all"
                    >
                        <Plus className="w-4 h-4" /> Create Campaign
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl mb-6 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-bold text-lg mb-4">New Campaign</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Campaign Name</label>
                            <input
                                className="w-full p-3 bg-gray-50 rounded-xl font-bold border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all"
                                placeholder="e.g. Weekly Newsletter"
                                value={newCampaign.name}
                                onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Type</label>
                                <select
                                    className="w-full p-3 bg-gray-50 rounded-xl font-bold border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all"
                                    value={newCampaign.type}
                                    onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })}
                                >
                                    <option value="sequence">Drip Sequence (Automated)</option>
                                    <option value="broadcast">Broadcast (One-time)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Sending Account</label>
                                <select
                                    className="w-full p-3 bg-gray-50 rounded-xl font-bold border-transparent focus:bg-white focus:border-black focus:ring-0 transition-all"
                                    value={newCampaign.accountId}
                                    onChange={e => setNewCampaign({ ...newCampaign, accountId: e.target.value })}
                                >
                                    <option value="">Select Account</option>
                                    {localAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.email})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
                            >
                                Create Campaign
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign List */}
            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-300" />
                    <p className="mt-2 text-gray-400 font-medium text-sm">Loading campaigns...</p>
                </div>
            ) : filteredCampaigns.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                    {searchQuery ? (
                        <>
                            <Search className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-gray-900 font-bold text-lg">No matches found</h3>
                            <p className="text-gray-400 max-w-sm mx-auto mt-1">Try adjusting your search terms.</p>
                        </>
                    ) : (
                        <>
                            <Megaphone className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-gray-900 font-bold text-lg">No Campaigns Yet</h3>
                            <p className="text-gray-400 max-w-sm mx-auto mt-1 mb-6">Create your first marketing campaign to start engaging with your leads on autopilot.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="px-6 py-2 bg-white border-2 border-gray-200 font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                            >
                                Start First Campaign
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredCampaigns.map(camp => (
                        <div key={camp.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => handleSelectCampaign(camp)}>
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${camp.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {camp.type === 'sequence' ? <PlayCircle className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{camp.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${camp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {camp.status}
                                            </span>
                                            <span className="text-gray-400 text-xs font-medium">• {camp.type}</span>
                                            <span className="text-gray-400 text-xs font-medium">• Created {new Date(camp.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Actions */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, camp.id, 'active')}>
                                                <PlayCircle className="w-4 h-4 mr-2 text-green-600" /> Set Active
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={(e) => handleStatusUpdate(e, camp.id, 'draft')}>
                                                <PauseCircle className="w-4 h-4 mr-2 text-gray-500" /> Set Draft
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                                <div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Sent</div>
                                    <div className="text-xl font-black text-gray-900">{camp.sentCount}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Opens</div>
                                    <div className="text-xl font-black text-gray-900">{camp.openCount}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Replies</div>
                                    <div className="text-xl font-black text-gray-900">{camp.replyCount}</div>
                                </div>
                                <div className="flex items-end justify-end">
                                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline">
                                        View Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
