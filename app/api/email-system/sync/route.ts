
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/smtp-encrypt'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { Readable } from 'stream'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

async function syncFolder(imap: any, accountId: string, folderName: string, limit: number = 25): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const emails: any[] = []
    const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 45000)

    imap.openBox(folderName, true, (err: any, box: any) => {
      if (err) {
        clearTimeout(timeout)
        console.log(`[SYNC_${folderName}] Error opening box:`, err.message)
        return reject(err) // Reject so fallback logic can run
      }

      const total = box.messages.total
      console.log(`[SYNC_${folderName}] ${total} messages`)

      if (total === 0) {
        clearTimeout(timeout)
        return resolve([])
      }

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

              // Date Priority: 1. Header Date (Sender), 2. Internal Date (Server), 3. Now
              // Log dates for debugging
              const headerDate = parsed.date;
              const internalDate = attributes.date;

              const emailDate = headerDate || internalDate || new Date()

              emails.push({
                uid: seqno,
                folder: folderName,
                from: fromText.substring(0, 255),
                to: parsed.to,
                toText: toText,
                subject: (parsed.subject || '(No Subject)').substring(0, 500),
                textSnippet: (parsed.text || '').substring(0, 1000),
                htmlContent: parsed.html || null,
                date: emailDate,
                hasAttachments,
                attachmentCount,
                isRead
              })
            } catch (e: any) {
              console.error('[SYNC_PARSE_ERROR]', e.message)
            }
          }
          checkComplete()
        })
      })

      fetch.once('end', () => {
        fetchEnded = true
        console.log(`[SYNC_${folderName}_END] Parsed: ${parsedMessages}`)
        checkComplete()
      })

      fetch.once('error', (fetchErr: any) => {
        clearTimeout(timeout)
        console.error(`[SYNC_${folderName}_ERROR]`, fetchErr.message)
        resolve([]) // Don't fail entire sync
      })
    })
  })
}

// Helper to ensure valid JSON for recipients
const sanitizeRecipient = (recip: any) => {
  if (!recip) return JSON.stringify([]);
  if (typeof recip === 'string') {
    return JSON.stringify([{ address: recip, name: '' }]);
  }
  if (Array.isArray(recip)) return JSON.stringify(recip);
  if (recip && typeof recip === 'object') return JSON.stringify([recip]);
  return JSON.stringify([]);
}

async function syncEmails(accountId: string, limit: number = 50) {
  // Fetch from smtp_accounts
  const [rows]: any = await pool.execute(
    `SELECT * FROM smtp_accounts WHERE id = ?`,
    [accountId]
  )

  const account = rows[0]
  if (!account || !account.is_active) {
    throw new Error('Account not found or inactive')
  }

  return new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 90000)

    try {
      const password = decrypt(account.encrypted_password)
      const imap = new Imap({
        user: account.username,
        password,
        host: account.imap_host,
        port: account.imap_port,
        tls: account.imap_secure === 1,
        tlsOptions: { rejectUnauthorized: false },
      })

      imap.once('ready', async () => {
        console.log('[SYNC_IMAP_READY]')

        try {
          // Sync INBOX
          const inboxEmails = await syncFolder(imap, accountId, 'INBOX', 25)
          console.log(`[SYNC_INBOX] Got ${inboxEmails.length} emails`)

          // Sync Sent (Robust)
          let sentEmails: any[] = []
          try {
            sentEmails = await syncFolder(imap, accountId, 'Sent', 25)
          } catch (e) {
            console.log('[SYNC_SENT_RETRY] Sent folder failed, trying Sent Items')
            try {
              sentEmails = await syncFolder(imap, accountId, 'Sent Items', 25)
            } catch (e2) {
              console.log('[SYNC_SENT_RETRY] Sent Items failed, trying INBOX.Sent')
              try {
                sentEmails = await syncFolder(imap, accountId, 'INBOX.Sent', 25)
              } catch (e3) {
                console.log('[SYNC_SENT_FAIL] All Sent folder variants failed')
              }
            }
          }
          // Normalize to 'Sent' for frontend consistency
          if (sentEmails.length > 0) {
            sentEmails.forEach(e => e.folder = 'Sent')
          }
          console.log(`[SYNC_SENT] Got ${sentEmails.length} emails`)

          const allEmails = [...inboxEmails, ...sentEmails]
          console.log(`[SYNC_SAVING] ${allEmails.length} total emails`)

          // Save to SQL 'emails' table
          if (allEmails.length > 0) {
            const values: any[] = []
            // Columns: tenant_id, user_id, smtp_account_id, uid, folder, from_name, from_address, recipient_to, body_text, body_html, received_at, attachment_count, subject
            const placeholders = allEmails.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')

            allEmails.forEach(email => {
              const toJSON = sanitizeRecipient(email.to || email.toText);
              const fromVal = email.from || '';

              values.push(
                account.tenant_id,
                account.created_by,
                accountId,
                email.uid,
                email.folder,
                fromVal.substring(0, 255), // from_name
                fromVal.substring(0, 255), // from_address
                toJSON, // recipient_to (JSON)
                email.textSnippet, // body_text
                email.htmlContent,
                email.date,
                email.attachmentCount,
                email.subject,
                email.isRead
              )
            })

            await pool.execute(`
                INSERT INTO emails 
                (tenant_id, user_id, smtp_account_id, uid, folder, from_name, from_address, recipient_to, body_text, body_html, received_at, attachment_count, subject, is_read)
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
          }

          // Update last_sync
          await pool.execute(
            `UPDATE smtp_accounts SET last_sync = NOW() WHERE id = ?`,
            [accountId]
          )

          try {
            // Analytics (Optional)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            await prisma.emailanalytics.upsert({
              where: { accountId_date: { accountId: String(accountId), date: today } },
              update: { emailsReceived: { increment: inboxEmails.length }, emailsSent: { increment: sentEmails.length } },
              create: { accountId: String(accountId), date: today, emailsSent: sentEmails.length, emailsReceived: inboxEmails.length, emailsRead: 0 }
            })
          } catch (e: any) {
            console.error('[SYNC_ANALYTICS_SKIP]', e.message)
          }

          clearTimeout(timeout)
          console.log(`[SYNC_COMPLETE] Saved ${allEmails.length} emails`)
          imap.end()
          resolve(allEmails.length)
        } catch (error) {
          clearTimeout(timeout)
          reject(error)
        }
      })

      imap.once('error', (err: any) => {
        clearTimeout(timeout)
        reject(err)
      })

      imap.once('end', () => {
        clearTimeout(timeout)
      })

      imap.connect()
    } catch (err) {
      clearTimeout(timeout)
      reject(err)
    }
  })
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { accountId, limit = 50 } = await request.json()

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    console.log(`[SYNC_START] AccountID: ${accountId}`)

    const synced = await syncEmails(accountId, limit)

    console.log(`[SYNC_SUCCESS] Synced ${synced} emails`)

    return NextResponse.json({
      success: true,
      synced,
      message: `Successfully synced ${synced} emails from Inbox + Sent`,
    })
  } catch (error: any) {
    console.error('[SYNC_ERROR]', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync emails',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
