
import pool from '@/lib/db'

async function check() {
    const campaignId = 'cmp-1768760176649-vw6rt92ag'
    try {
        const [leads]: any = await pool.execute(
            `SELECT id, leadEmail, status, currentStep, nextStepDue FROM campaign_lead WHERE campaignId = ?`,
            [campaignId]
        )
        console.log('Leads:', leads)
        process.exit(0)
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}
check()
