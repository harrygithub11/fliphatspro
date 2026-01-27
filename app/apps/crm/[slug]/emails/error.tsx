'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Admin Emails Page Error:', error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50 text-center">
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-zinc-900">Something went wrong!</h2>
                <p className="max-w-[500px] text-zinc-500 text-sm">{error.message}</p>
            </div>
            <div className="flex gap-2">
                <Button onClick={() => reset()}>Try again</Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Full Refresh
                </Button>
            </div>
        </div>
    )
}
