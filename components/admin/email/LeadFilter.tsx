
import React, { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'

interface LeadFilterProps {
    className?: string
    filters: {
        stage: string
        score: string
        source: string
        search: string
    }
    onChange: (filters: { stage: string, score: string, source: string, search: string }) => void
}

export function LeadFilter({ className, filters, onChange }: LeadFilterProps) {
    const [options, setOptions] = useState({
        stages: [] as { value: string, label: string }[],
        scores: [] as { value: string, label: string, emoji?: string }[],
        sources: [] as string[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await fetch('/api/marketing/lead-filters')
                const data = await res.json()
                if (data.success) {
                    setOptions({
                        stages: data.stages || [],
                        scores: data.scores || [],
                        sources: data.sources || []
                    })
                }
            } catch (error) {
                console.error('Failed to load filter options', error)
            } finally {
                setLoading(false)
            }
        }
        fetchOptions()
    }, [])

    const handleChange = (key: string, value: string) => {
        onChange({ ...filters, [key]: value })
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Filter className="w-4 h-4" />
                <span>Filter Rules</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Search */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Search Keywords</label>
                    <input
                        className="w-full p-2.5 bg-gray-50 rounded-lg text-sm font-bold border border-gray-100 focus:bg-white focus:border-black focus:ring-0 transition-all"
                        placeholder="Search name, email, company..."
                        value={filters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                    />
                </div>

                {/* Stage */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Stage</label>
                    <select
                        className="w-full p-2.5 bg-gray-50 rounded-lg text-sm font-bold border border-gray-100 focus:bg-white focus:border-black focus:ring-0 transition-all"
                        value={filters.stage}
                        onChange={(e) => handleChange('stage', e.target.value)}
                        disabled={loading}
                    >
                        <option value="">All Stages</option>
                        {options.stages.map(stage => (
                            <option key={stage.value} value={stage.value}>{stage.label}</option>
                        ))}
                    </select>
                </div>

                {/* Score */}
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Score</label>
                    <select
                        className="w-full p-2.5 bg-gray-50 rounded-lg text-sm font-bold border border-gray-100 focus:bg-white focus:border-black focus:ring-0 transition-all"
                        value={filters.score}
                        onChange={(e) => handleChange('score', e.target.value)}
                        disabled={loading}
                    >
                        <option value="">All Scores</option>
                        {options.scores.map(score => (
                            <option key={score.value} value={score.value}>
                                {score.label} {score.emoji}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Source */}
                <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Source</label>
                    <select
                        className="w-full p-2.5 bg-gray-50 rounded-lg text-sm font-bold border border-gray-100 focus:bg-white focus:border-black focus:ring-0 transition-all"
                        value={filters.source}
                        onChange={(e) => handleChange('source', e.target.value)}
                        disabled={loading}
                    >
                        <option value="">All Sources</option>
                        {options.sources.map(src => (
                            <option key={src} value={src}>{src}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}
