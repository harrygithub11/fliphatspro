
import pool from '@/lib/db'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

interface RunResult {
    success: boolean
    processed: number
    sent: number
    delayed: number
    completed: number
    errors: number
    message: string
    error?: string
}

async function logCampaignEvent(connection: any, campaignId: string, leadId: string | null, type: string, message: string) {
    try {
        await connection.execute(
            `INSERT INTO campaign_logs (campaign_id, lead_id, type, message) VALUES (?, ?, ?, ?)`,
            [campaignId, leadId, type, message]
        )
    } catch (e) {
        console.error('[LOG_ERROR]', e)
    }
}

export async function runCampaign(campaignId: string, tenantId: string, options: { force?: boolean } = {}): Promise<RunResult> {
    console.log(`[RUN_LIB] Starting run for ${campaignId} (Force: ${options.force})`)
    let connection: any

    try {
        connection = await pool.getConnection()
        console.log('[RUN_LIB] DB Connection Acquired')

        // 1. Get campaign with account info
        const [campaigns]: any = await connection.execute(
            `SELECT c.*, ea.id as accountId, ea.username, ea.from_email as fromEmail, ea.host as smtp_host, ea.port as smtp_port, ea.encrypted_password as password
             FROM marketing_campaign c
             LEFT JOIN smtp_accounts ea ON ea.id = c.accountId
             WHERE c.id = ? AND c.tenant_id = ?`,
            [campaignId, tenantId]
        )
        console.log(`[RUN_LIB] Campaigns found: ${campaigns.length}`)

        if (campaigns.length === 0) {
            connection.release()
            return { success: false, processed: 0, sent: 0, delayed: 0, completed: 0, errors: 0, message: '', error: 'Campaign not found' }
        }

        const campaign = campaigns[0]

        if (!campaign.accountId || !campaign.smtp_host) {
            connection.release()
            return { success: false, processed: 0, sent: 0, delayed: 0, completed: 0, errors: 0, message: '', error: 'Campaign has no email account configured.' }
        }

        // 2. Get all campaign steps ordered by stepOrder
        const [steps]: any = await connection.execute(
            `SELECT * FROM campaign_step WHERE campaignId = ? ORDER BY stepOrder ASC`,
            [campaignId]
        )
        console.log(`[RUN_LIB] Steps found: ${steps.length}`)

        if (steps.length === 0) {
            connection.release()
            return { success: false, processed: 0, sent: 0, delayed: 0, completed: 0, errors: 0, message: '', error: 'No steps defined for this campaign' }
        }

        // 3. Get leads that are due for processing (Tenant Scoped by Campaign)
        const leadQuery = options.force
            ? `SELECT * FROM campaign_lead WHERE campaignId = ? AND status = 'active'`
            : `SELECT * FROM campaign_lead WHERE campaignId = ? AND status = 'active' AND (currentStep = 0 OR nextStepDue <= NOW()) LIMIT 100`

        const [leads]: any = await connection.execute(leadQuery, [campaignId])
        console.log(`[RUN_LIB] Leads found: ${leads.length}`)

        if (leads.length === 0) {
            connection.release()
            return {
                success: true,
                processed: 0,
                sent: 0,
                delayed: 0,
                completed: 0,
                errors: 0,
                message: 'No leads ready to process'
            }
        }

        // 4. Setup email transporter
        console.log('[RUN_LIB] Setting up transporter')
        let password: string
        try {
            password = decrypt(campaign.password)
        } catch (e) {
            console.error('[RUN_LIB] Decrypt failed:', e)
            connection.release()
            return { success: false, processed: 0, sent: 0, delayed: 0, completed: 0, errors: 0, message: '', error: 'Failed to decrypt account password' }
        }

        const transporter = nodemailer.createTransport({
            host: campaign.smtp_host,
            port: campaign.smtp_port,
            secure: campaign.smtp_port === 465,
            auth: {
                user: campaign.username || campaign.fromEmail,
                pass: password
            }
        })

        // 5. Process each lead
        let sentCount = 0
        let delayedCount = 0
        let completedCount = 0
        let errorCount = 0

        for (const lead of leads) {
            let stepsProcessed = 0
            const MAX_STEPS_PER_RUN = 5

            let currentStepIndex = lead.currentStep || 0
            let nextDue = new Date(lead.nextStepDue || Date.now())

            while (stepsProcessed < MAX_STEPS_PER_RUN) {
                // Stop if we are waiting for a future time UNLESS force is true
                if (!options.force && nextDue > new Date()) {
                    break
                }

                // Stop if all steps completed
                if (currentStepIndex >= steps.length) {
                    await connection.execute(
                        `UPDATE campaign_lead SET status = 'completed' WHERE id = ?`,
                        [lead.id]
                    )
                    await logCampaignEvent(connection, campaignId, lead.id, 'COMPLETED', 'Campaign completed for this lead')
                    completedCount++
                    break
                }

                const step = steps[currentStepIndex]

                try {
                    let actionTaken = false

                    if (step.type === 'email') {
                        // --- TEMPLATE VARIABLE REPLACEMENT ---
                        // 1. Fetch customer data from CRM (Strict Ownership Mode)
                        let customerData: any = null
                        const campaignOwnerId = campaign.created_by || 1;

                        try {
                            const [custRows]: any = await connection.execute(
                                `SELECT cust.id, cust.name, cust.email, 
                                        COALESCE(comp.name, cust.company) as company 
                                 FROM customers cust
                                 LEFT JOIN companies comp ON cust.company_id = comp.id AND comp.owner_id = ?
                                 WHERE cust.email = ? AND cust.tenant_id = ? AND cust.owner_id = ?`,
                                [campaignOwnerId, lead.leadEmail, tenantId, campaignOwnerId]
                            )
                            if (custRows.length > 0) {
                                customerData = custRows[0]
                            } else {
                                // Double check: If lead exists but owner mismatch, we log a warning? 
                                // Or we simply fall back to generic data (which is null here).
                                // User said "strictly... match than show only", implying if no match, don't show the data.
                                // So customerData remains null.
                            }
                        } catch (e) {
                            console.error('[TEMPLATE] Failed to fetch customer data:', e)
                        }

                        // 2. Build variable map
                        const emailParts = lead.leadEmail.split('@')
                        const emailName = emailParts[0] || ''
                        const emailDomain = emailParts[1] || ''

                        // Parse name into first/last (if customer exists)
                        let firstName = 'there' // Friendly default: "Hello there"
                        let lastName = ''
                        let fullName = 'there'

                        if (customerData?.name) {
                            const nameParts = customerData.name.trim().split(/\s+/)
                            firstName = nameParts[0] || 'there'
                            lastName = nameParts.slice(1).join(' ') || ''
                            fullName = customerData.name
                        } else {
                            // Try to make email prefix look like a name
                            // e.g., "john.doe" -> "John", "john_smith123" -> "John"
                            const cleanedName = emailName.split(/[._\-\d]/)[0]
                            if (cleanedName && cleanedName.length > 2) {
                                firstName = cleanedName.charAt(0).toUpperCase() + cleanedName.slice(1).toLowerCase()
                                fullName = firstName
                            }
                        }

                        const variables: Record<string, string> = {
                            'name': fullName,
                            'firstname': firstName,
                            'lastname': lastName,
                            'email': lead.leadEmail,
                            'company': customerData?.company || '',
                            'domain': emailDomain,
                        }

                        // 3. Replace all {{variable}} patterns
                        const replaceVariables = (text: string): string => {
                            return text.replace(/\{\{(\w+)\}\}/gi, (match, key) => {
                                const lowerKey = key.toLowerCase()
                                return variables[lowerKey] !== undefined ? variables[lowerKey] : match
                            })
                        }

                        const subject = replaceVariables(step.subject || '')
                        const htmlBody = replaceVariables(step.htmlBody || '')

                        await transporter.sendMail({
                            from: `"${campaign.name}" <${campaign.fromEmail}>`,
                            to: lead.leadEmail,
                            subject: subject,
                            html: htmlBody,
                            text: htmlBody.replace(/<[^>]*>/g, '')
                        })

                        await logCampaignEvent(connection, campaignId, lead.id, 'EMAIL_SENT', `Sent Step ${currentStepIndex + 1}: ${subject}`)
                        sentCount++
                        actionTaken = true

                        // --- SYNC TO CRM START ---
                        try {
                            // 1. Find Customer ID
                            const [custRows]: any = await connection.execute(
                                'SELECT id FROM customers WHERE email = ? AND tenant_id = ?',
                                [lead.leadEmail, tenantId]
                            )

                            const customerId = custRows.length > 0 ? custRows[0].id : null
                            // 2. Insert into emails (Sent Folder)
                            // 2. Insert into emails (Sent Folder)
                            const recipientJson = JSON.stringify([{ name: emailName, email: lead.leadEmail }])
                            const userId = campaign.created_by || 1; // Use campaign creator or fallback

                            // Retry loop for UID uniqueness
                            let inserted = false
                            let attempts = 0
                            while (!inserted && attempts < 3) {
                                try {
                                    // Generate a unique negative UID to avoid collision with IMAP UIDs (positive)
                                    // Use timestamp (seconds) + random + attempt offset
                                    const tempUid = -1 * (Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000000) + attempts);

                                    await connection.execute(`
                                        INSERT INTO emails (
                                            tenant_id, user_id, smtp_account_id, uid, customer_id, direction, folder, status, 
                                            from_address, from_name, subject, body_html, body_text, 
                                            recipient_to, is_read, created_at, updated_at
                                        ) VALUES (?, ?, ?, ?, ?, 'outbound', 'SENT', 'sent', ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
                                    `, [
                                        tenantId,
                                        userId,
                                        campaign.accountId,
                                        tempUid,
                                        customerId,
                                        campaign.fromEmail,
                                        campaign.name || '',
                                        subject,
                                        htmlBody,
                                        htmlBody.replace(/<[^>]*>/g, ''), // Simple strip tags
                                        recipientJson
                                    ])
                                    inserted = true
                                } catch (e: any) {
                                    if (e.code === 'ER_DUP_ENTRY') {
                                        attempts++
                                        if (attempts >= 3) console.error('[CAMPAIGN_SYNC] Failed to insert email after 3 retries (Dupe UID)')
                                    } else {
                                        throw e // Rethrow other errors
                                    }
                                }
                            }

                            // 3. Log Interaction
                            if (customerId) {
                                await connection.execute(`
                                    INSERT INTO interactions (tenant_id, customer_id, type, content, created_at, created_by)
                                    VALUES (?, ?, 'email_outbound', ?, NOW(), ?)
                                `, [
                                    tenantId,
                                    customerId,
                                    `Campaign Email: ${subject}`,
                                    userId
                                ])
                            }
                        } catch (syncError) {
                            console.error('[CAMPAIGN_SYNC_ERROR] Failed to sync email to CRM:', syncError)
                            // Do not fail the run, just log error
                        }
                        // --- SYNC TO CRM END ---

                    } else if (step.type === 'delay') {
                        // Delay passed, logging execution
                        await logCampaignEvent(connection, campaignId, lead.id, 'DELAY_PROCESSED', `Finished waiting for Step ${currentStepIndex + 1}`)
                        delayedCount++
                        actionTaken = true
                    }

                    // Move to Next Step
                    const nextStepIndex = currentStepIndex + 1

                    let secondsToAdd = 0
                    let logMsg = ''
                    if (nextStepIndex < steps.length && steps[nextStepIndex].type === 'delay') {
                        secondsToAdd = steps[nextStepIndex].delaySeconds || 3600
                        logMsg = `Next step is delay. Waiting ${secondsToAdd}s.`
                    }

                    await connection.execute(
                        `UPDATE campaign_lead SET currentStep = ?, nextStepDue = DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE id = ?`,
                        [nextStepIndex, secondsToAdd, lead.id]
                    )

                    if (logMsg) {
                        await logCampaignEvent(connection, campaignId, lead.id, 'DELAY_STARTED', logMsg)
                    }

                    currentStepIndex = nextStepIndex
                    nextDue = new Date(Date.now() + (secondsToAdd * 1000))
                    stepsProcessed++

                } catch (error: any) {
                    console.error(`[CAMPAIGN_RUN] Error processing lead ${lead.id}:`, error)
                    await logCampaignEvent(connection, campaignId, lead.id, 'ERROR', `Error at step ${currentStepIndex + 1}: ${error.message}`)
                    errorCount++
                    break
                }
            }
        }

        // 6. Update campaign stats
        if (sentCount > 0) {
            await connection.execute(
                `UPDATE marketing_campaign SET sentCount = sentCount + ? WHERE id = ?`,
                [sentCount, campaignId]
            )
        }

        connection.release()

        return {
            success: true,
            processed: leads.length,
            sent: sentCount,
            delayed: delayedCount,
            completed: completedCount,
            errors: errorCount,
            message: `Processed ${leads.length} leads: ${sentCount} emails sent, ${delayedCount} scheduled, ${completedCount} completed`
        }

    } catch (error: any) {
        if (connection) connection.release()
        console.error('[CAMPAIGN_RUN_ERROR]', error)
        return { success: false, processed: 0, sent: 0, delayed: 0, completed: 0, errors: 0, message: '', error: error.message }
    }
}
