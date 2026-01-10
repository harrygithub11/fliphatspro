import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import Imap from 'imap'
import { simpleParser } from 'mailparser'
import { Readable } from 'stream'

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
        return resolve([]) // Don't fail entire sync if one folder fails
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

        msg.on('body', (stream: any) => {
          simpleParser(stream as Readable, (parseErr: any, parsed: any) => {
            parsedMessages++

            if (!parseErr && parsed) {
              try {
                const fromText = parsed.from?.text || parsed.from?.value?.[0]?.address || 'Unknown'
                const toText = parsed.to?.text || parsed.to?.value?.[0]?.address || ''
                const hasAttachments = parsed.attachments && parsed.attachments.length > 0
                const attachmentCount = parsed.attachments?.length || 0

                emails.push({
                  uid: seqno,
                  folder: folderName,
                  from: fromText.substring(0, 255),
                  to: toText.substring(0, 255),
                  subject: (parsed.subject || '(No Subject)').substring(0, 500),
                  textSnippet: (parsed.text || '').substring(0, 1000),
                  htmlContent: parsed.html || null,
                  date: parsed.date || new Date(),
                  hasAttachments,
                  attachmentCount,
                })
              } catch (e: any) {
                console.error('[SYNC_PARSE_ERROR]', e.message)
              }
            }

            checkComplete()
          })
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

async function syncEmails(accountId: string, limit: number = 50) {
  const account = await prisma.emailaccount.findUnique({ where: { id: accountId } })
  if (!account || !account.isActive) {
    throw new Error('Account not found or inactive')
  }

  return new Promise<number>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 90000)

    try {
      const password = decrypt(account.password)
      const imap = new Imap({
        user: account.username,
        password,
        host: account.imapHost,
        port: account.imapPort,
        tls: account.imapSecure,
        tlsOptions: { rejectUnauthorized: false },
      })

      imap.once('ready', async () => {
        console.log('[SYNC_IMAP_READY]')
        
        try {
          // Sync INBOX (25 most recent)
          const inboxEmails = await syncFolder(imap, accountId, 'INBOX', 25)
          console.log(`[SYNC_INBOX] Got ${inboxEmails.length} emails`)

          // Sync Sent (25 most recent)
          const sentEmails = await syncFolder(imap, accountId, 'Sent', 25)
          console.log(`[SYNC_SENT] Got ${sentEmails.length} emails`)

          const allEmails = [...inboxEmails, ...sentEmails]
          console.log(`[SYNC_SAVING] ${allEmails.length} total emails`)

          // Save all emails to database
          for (const email of allEmails) {
            try {
              // Create unique ID combining uid and folder
              const uniqueId = `${accountId}-${email.uid}-${email.folder}`
              
              await prisma.cachedemail.upsert({
                where: {
                  accountId_uid_folder: {
                    accountId: accountId,
                    uid: email.uid,
                    folder: email.folder,
                  },
                },
                update: {
                  from: email.from,
                  to: email.to,
                  subject: email.subject,
                  textSnippet: email.textSnippet,
                  htmlContent: email.htmlContent,
                  date: email.date,
                  hasAttachments: email.hasAttachments || false,
                  attachmentCount: email.attachmentCount || 0,
                },
                create: {
                  id: uniqueId,
                  accountId,
                  uid: email.uid,
                  folder: email.folder,
                  from: email.from,
                  to: email.to,
                  subject: email.subject,
                  textSnippet: email.textSnippet,
                  htmlContent: email.htmlContent,
                  date: email.date,
                  hasAttachments: email.hasAttachments || false,
                  attachmentCount: email.attachmentCount || 0,
                },
              })
            } catch (dbError: any) {
              console.error('[SYNC_DB_ERROR]', dbError.message)
            }
          }

          await prisma.emailaccount.update({
            where: { id: accountId },
            data: { lastSync: new Date() },
          })

          // Record analytics
          try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            await prisma.emailanalytics.upsert({
              where: {
                accountId_date: {
                  accountId,
                  date: today,
                },
              },
              update: {
                emailsReceived: { increment: inboxEmails.length },
                emailsSent: { increment: sentEmails.length },
              },
              create: {
                accountId,
                date: today,
                emailsSent: sentEmails.length,
                emailsReceived: inboxEmails.length,
                emailsRead: 0,
              },
            })
            console.log(`[SYNC_ANALYTICS] Recorded: ${inboxEmails.length} received, ${sentEmails.length} sent`)
          } catch (analyticsError: any) {
            console.error('[SYNC_ANALYTICS_ERROR]', analyticsError.message)
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
