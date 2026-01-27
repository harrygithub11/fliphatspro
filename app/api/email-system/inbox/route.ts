import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { Readable } from 'stream'
import { decrypt } from '@/lib/smtp-encrypt'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function syncFolder(imap: any, folderName: string, limit: number = 50): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const emails: any[] = []
    const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 30000)

    imap.openBox(folderName, true, (err: any, box: any) => {
      if (err) {
        clearTimeout(timeout)
        console.log(`[INBOX_${folderName}] Error opening box:`, err.message)
        return reject(err) // Reject so fallback logic can run
      }

      const total = box.messages.total
      console.log(`[INBOX_${folderName}] ${total} messages`)

      if (total === 0) {
        clearTimeout(timeout)
        return resolve([])
      }

      // Fetch latest 'limit' messages
      const fetchCount = Math.min(limit, total)
      const start = Math.max(1, total - fetchCount + 1)
      const fetch = imap.seq.fetch(`${start}:${total}`, { bodies: '', struct: true })

      let expectedMessages = 0
      let parsedMessages = 0
      let fetchEnded = false

      const checkComplete = () => {
        if (fetchEnded && parsedMessages === expectedMessages) {
          clearTimeout(timeout)
          resolve(emails)
        }
      }

      fetch.on('message', (msg: any, seqno: number) => {
        expectedMessages++

        const attributesPromise = new Promise((resolve) => {
          msg.once('attributes', (attrs: any) => resolve(attrs))
        })

        const bodyPromise = new Promise((resolve) => {
          msg.on('body', (stream: any) => {
            simpleParser(stream as Readable, (parseErr: any, parsed: any) => {
              resolve({ parseErr, parsed })
            })
          })
        })

        Promise.all([attributesPromise, bodyPromise]).then(([attrs, bodyResult]: any) => {
          parsedMessages++
          const { parseErr, parsed } = bodyResult
          const attributes = attrs || {}

          // Capture Flags
          const flags = attributes.flags || []
          const isRead = flags.includes('\\Seen') ? 1 : 0

          if (!parseErr && parsed) {
            try {
              const fromText = parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown'
              const toText = parsed.to?.text || parsed.to?.value?.[0]?.address || ''
              const hasAttachments = parsed.attachments && parsed.attachments.length > 0
              const attachmentCount = parsed.attachments?.length || 0
              const internalDate = attributes.date
              const emailDate = parsed.date || internalDate || new Date()

              emails.push({
                uid: seqno,
                folder: folderName,
                from: fromText.substring(0, 255),
                to: toText.substring(0, 255),
                subject: (parsed.subject || '(No Subject)').substring(0, 500),
                text: (parsed.text || '').substring(0, 1000),
                htmlContent: parsed.html || null,
                date: emailDate,
                hasAttachments,
                attachmentCount,
                isRead,
              })
            } catch (e: any) {
              console.error('[INBOX_PARSE_ERROR]', e.message)
            }
          }
          checkComplete()
        })
      })

      fetch.once('end', () => {
        fetchEnded = true
        console.log(`[INBOX_${folderName}_END] Parsed: ${parsedMessages}`)
        checkComplete()
      })

      fetch.once('error', (fetchErr: any) => {
        clearTimeout(timeout)
        console.error(`[INBOX_${folderName}_ERROR]`, fetchErr.message)
        resolve([])
      })
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)
    const { accountId, limit = 50, folder = 'INBOX', skipSync = true } = await request.json()

    if (!accountId) return NextResponse.json({ error: 'Account ID required' }, { status: 400 })

    console.log('[INBOX] Request:', { accountId, folder, skipSync })

    // 1. Verify Account & Get Credentials
    const [accounts]: any = await pool.execute(`
      SELECT id, from_email, imap_host, imap_port, username, encrypted_password, created_by, tenant_id
      FROM smtp_accounts 
      WHERE id = ? AND tenant_id = ? AND created_by = ? AND is_active = 1
    `, [accountId, tenantId, session.id])

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 })
    }

    const account = accounts[0]
    const accountIdNum = parseInt(String(accountId), 10)
    let syncError = null
    let shouldSync = !skipSync

    // 2. Check DB Count if we plan to skip sync
    if (!shouldSync) {
      const [countResult]: any = await pool.execute(
        `SELECT COUNT(*) as count FROM emails WHERE smtp_account_id = ? AND folder = ?`,
        [accountIdNum, folder]
      )
      const dbCount = countResult[0]?.count || 0
      if (dbCount === 0) {
        console.log('[INBOX] DB is empty, forcing sync...')
        shouldSync = true
      }
    }

    // 3. Fetch from IMAP (If shouldSync is true)
    if (shouldSync) {
      try {
        const password = decrypt(account.encrypted_password)
        const imap = new Imap({
          user: account.username,
          password,
          host: account.imap_host,
          port: account.imap_port || 993,
          tls: true,
          tlsOptions: { rejectUnauthorized: false },
        })

        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('IMAP connection timeout')), 25000)

          imap.once('ready', async () => {
            try {
              console.log('[INBOX_SYNC] Connected to IMAP. Target:', folder)

              let emails: any[] = []
              let successFolder = folder

              try {
                emails = await syncFolder(imap, folder, limit)
              } catch (e: any) {
                // Fallback for Sent folder
                if (folder === 'Sent' || folder === 'SENT') {
                  console.log('[INBOX_SYNC] Failed primary Sent. Trying fallbacks...')
                  try {
                    emails = await syncFolder(imap, 'Sent Items', limit)
                    successFolder = 'Sent Items'
                  } catch (e2) {
                    try {
                      emails = await syncFolder(imap, 'INBOX.Sent', limit)
                      successFolder = 'INBOX.Sent'
                    } catch (e3) {
                      throw e // Throw original error if all fail
                    }
                  }
                } else {
                  throw e
                }
              }

              // Normalize folder in memory so DB has "Sent" (matching frontend request)
              if (emails.length > 0 && successFolder !== folder) {
                console.log(`[INBOX_SYNC] Normalizing ${emails.length} emails from '${successFolder}' to '${folder}'`)
                emails = emails.map(e => ({ ...e, folder: folder }))
              }

              console.log(`[INBOX_SYNC] Fetched ${emails.length} emails, saving to DB...`)

              // 4. Upsert to Database
              if (emails.length > 0) {
                const values: any[] = []
                const placeholders = emails.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')

                const sanitizeRecipient = (recip: any) => {
                  if (!recip) return JSON.stringify([]);
                  if (typeof recip === 'string') {
                    return JSON.stringify([{ address: recip, name: '' }]);
                  }
                  if (Array.isArray(recip)) return JSON.stringify(recip);
                  if (recip && typeof recip === 'object') return JSON.stringify([recip]);
                  return JSON.stringify([]);
                }

                emails.forEach(email => {
                  const fromVal = email.from || '';
                  values.push(
                    tenantId,
                    session.id,
                    accountId,
                    email.uid,
                    folder,
                    fromVal.substring(0, 255),
                    fromVal.substring(0, 255),
                    sanitizeRecipient(email.to),
                    email.subject,
                    email.text,
                    email.htmlContent,
                    email.date,
                    email.attachmentCount,
                    email.isRead
                  )
                })

                await pool.execute(`
                  INSERT INTO emails 
                  (tenant_id, user_id, smtp_account_id, uid, folder, from_name, from_address, recipient_to, subject, body_text, body_html, received_at, attachment_count, is_read)
                  VALUES ${placeholders}
                  ON DUPLICATE KEY UPDATE
                  from_name = VALUES(from_name),
                  recipient_to = VALUES(recipient_to),
                  subject = VALUES(subject),
                  body_text = VALUES(body_text),
                  body_html = VALUES(body_html),
                  received_at = VALUES(received_at),
                  attachment_count = VALUES(attachment_count),
                  is_read = VALUES(is_read)
                `, values)

                console.log('[INBOX_SYNC] DB Update complete')
              }

              imap.end()
              clearTimeout(timeout)
              resolve()
            } catch (err: any) {
              clearTimeout(timeout)
              console.error('[INBOX_SYNC_FAIL]', err.message)
              reject(err)
            }
          })

          imap.once('error', (err: any) => {
            clearTimeout(timeout)
            reject(err)
          })

          imap.connect()
        })
      } catch (err: any) {
        console.error('[INBOX_IMAP_ERROR]', err.message)
        syncError = err.message
      }
    }

    // 5. Return Emails from Database (Cache)
    console.log('[INBOX_FETCH] Retrieving from DB...')
    const limitNum = parseInt(String(limit), 10) || 50
    const [dbEmails]: any = await pool.execute(`
      SELECT 
        uid,
        from_name as \`from\`,
        recipient_to as \`to\`,
        subject,
        body_text as text,
        body_html as htmlContent,
        COALESCE(received_at, created_at) as date,
        folder,
        attachment_count as attachmentCount,
        is_read as isRead
      FROM emails
      WHERE smtp_account_id = ${accountIdNum} AND tenant_id = ? AND folder = ?
      ORDER BY COALESCE(received_at, created_at) DESC
      LIMIT ${limitNum}
    `, [tenantId, folder])

    const transformedEmails = dbEmails.map((email: any) => ({
      ...email,
      date: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
      hasAttachments: email.attachmentCount > 0,
    }))

    return NextResponse.json({
      success: true,
      emails: transformedEmails,
      count: transformedEmails.length,
      cached: !shouldSync, // True only if we skipped sync
      syncError
    })

  } catch (error: any) {
    console.error('[INBOX_ERROR]', error.message)
    return NextResponse.json({ error: 'Failed to load emails', details: error.message }, { status: 500 })
  }
}
