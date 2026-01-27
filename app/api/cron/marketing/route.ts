
import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

// This would typically be secured by a CRON_SECRET header
export async function GET(request: Request) {
    let connection;
    try {
        console.log('[MARKETING_CRON] Starting run...')
        connection = await pool.getConnection()

        // 1. Fetch active leads due for processing
        // We join with campaign to ensure campaign is active
        const [leads]: any = await connection.execute(`
            SELECT 
                l.id as leadId,
                l.leadEmail,
                l.currentStep,
                l.campaignId,
                c.tenant_id,
                c.accountId
            FROM campaign_lead l
            JOIN marketing_campaign c ON l.campaignId = c.id
            WHERE l.status = 'active'
            AND c.status = 'active'
            AND (l.nextStepDue IS NULL OR l.nextStepDue <= NOW())
            LIMIT 50
        `)

        console.log(`[MARKETING_CRON] Found ${leads.length} leads due.`)

        const results = { processed: 0, errors: 0, emailsSent: 0 }

        for (const lead of leads) {
            try {
                // Fetch next steps for this campaign, starting from currentStep + 1
                // Assuming currentStep is the 'order' of the last completed step.
                // If lead is new, currentStep is 0.

                const [steps]: any = await connection.execute(`
                    SELECT * FROM campaign_step 
                    WHERE campaignId = ? 
                    AND stepOrder > ? 
                    ORDER BY stepOrder ASC 
                    LIMIT 2
                `, [lead.campaignId, lead.currentStep])

                if (steps.length === 0) {
                    // No more steps, mark completed
                    await connection.execute(`UPDATE campaign_lead SET status = 'completed', nextStepDue = NULL WHERE id = ?`, [lead.leadId]);
                    console.log(`[MARKETING_CRON] Lead ${lead.leadId} completed campaign.`)
                    continue;
                }

                const nextStep = steps[0];

                // EXECUTE STEP
                if (nextStep.type === 'email') {
                    // Send Email
                    // 1. Get SMTP Credentials
                    const [accounts]: any = await connection.execute(
                        'SELECT * FROM smtp_accounts WHERE id = ?',
                        [lead.accountId]
                    );

                    if (accounts.length === 0) {
                        throw new Error(`SMTP Account ${lead.accountId} not found for campaign`);
                    }
                    const account = accounts[0];

                    // 2. Transporter
                    const transporter = nodemailer.createTransport({
                        host: account.host,
                        port: account.port,
                        secure: account.secure,
                        auth: {
                            user: account.username,
                            pass: account.password
                        },
                        tls: { rejectUnauthorized: false }
                    });

                    // 3. Send
                    // Simple variable substitution
                    let body = nextStep.htmlBody || '';
                    body = body.replace('{{email}}', lead.leadEmail);

                    await transporter.sendMail({
                        from: `"${account.fromName}" <${account.username}>`,
                        to: lead.leadEmail,
                        subject: nextStep.subject,
                        html: body
                    });

                    results.emailsSent++;

                    // Update stats (optional, usually update campaign sentCount)
                    await connection.execute('UPDATE marketing_campaign SET sentCount = sentCount + 1 WHERE id = ?', [lead.campaignId]);
                } else if (nextStep.type === 'delay') {
                    // It's a delay step. 
                    // Logic: We "process" the delay by setting the nextStepDue for the *next* actual action.
                    // Actually, if the step is JUST a delay, we simply mark this step as done, 
                    // and set the lead's nextStepDue to NOW + delay.
                    // The NEXT run will pick up the step AFTER the delay.

                    const seconds = nextStep.delaySeconds || 0;
                    const dueTime = new Date(Date.now() + (seconds * 1000));

                    await connection.execute(`
                        UPDATE campaign_lead 
                        SET currentStep = ?, nextStepDue = ? 
                        WHERE id = ?
                    `, [nextStep.stepOrder, dueTime, lead.leadId]);

                    console.log(`[MARKETING_CRON] Lead ${lead.leadId} delayed until ${dueTime.toISOString()}`);
                    results.processed++;
                    continue; // Done with this lead for now
                }

                // If it was an email (or other instant action), we move to the next step immediately OR check if next is delay.
                // Should we chain multiple instant steps? 
                // For simplicity: One step per cron run unless we want to be fancy. 
                // BUT if we just sent an email, we should mark this step done.
                // And setting nextStepDue to NOW() invokes immediate pickup next run.

                await connection.execute(`
                    UPDATE campaign_lead 
                    SET currentStep = ?, nextStepDue = NOW() 
                    WHERE id = ?
                `, [nextStep.stepOrder, lead.leadId]);

                results.processed++;

            } catch (err: any) {
                console.error(`[MARKETING_CRON] Error processing lead ${lead.leadId}:`, err);
                results.errors++;
            }
        }

        connection.release();
        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        if (connection) connection.release();
        console.error('[MARKETING_CRON] Global error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
