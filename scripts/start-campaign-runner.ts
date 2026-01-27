
/**
 * Simple Campaign Runner Script
 * Usage: npx tsx scripts/start-campaign-runner.ts
 * 
 * This script hits the internal Cron API every minute to process active campaigns.
 * Keep this terminal open to keep campaigns running.
 */

async function runRunner() {
    // Default URL - Make sure your app is running on this port!
    const API_URL = 'http://localhost:3057/api/marketing/cron?secret=fliphats_cron_secret'

    console.log('🚀 Starting Campaign Runner...')
    console.log(`📡 Target: ${API_URL}`)
    console.log('🔄 Press Ctrl+C to stop.\n')

    while (true) {
        try {
            const now = new Date().toLocaleTimeString()
            process.stdout.write(`[${now}] ⚡ Triggering run... `)

            const res = await fetch(API_URL)
            const data = await res.json()

            if (data.success) {
                console.log(`✅ OK! (${data.campaignsProcessed} campaigns)`)
                if (data.details && Array.isArray(data.details)) {
                    data.details.forEach((d: any) => {
                        const sent = d.result?.sent || 0
                        const delayed = d.result?.delayed || 0
                        if (sent > 0 || delayed > 0) {
                            console.log(`   > ${d.campaign}: Sent ${sent}, Delayed ${delayed}`)
                        }
                    })
                }
            } else {
                console.log(`❌ Failed: ${data.error}`)
            }
        } catch (error: any) {
            console.log(`❌ Error: ${error.message}`)
            console.log('   (Make sure the Next.js app is running on port 3057)')
        }

        await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 60s
    }
}

runRunner()
