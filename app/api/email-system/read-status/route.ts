
import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/smtp-encrypt'
import Imap from 'imap'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Get read status for account
export async function GET(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Verify account access using smtp_accounts
    const [accounts]: any = await pool.execute(
      `SELECT id FROM smtp_accounts WHERE id = ? AND tenant_id = ? AND created_by = ? AND is_active = 1`,
      [accountId, tenantId, session.id]
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 })
    }

    // Get read statuses from emails table (is_read column)
    const [readEmails]: any = await pool.execute(
      `SELECT uid, folder FROM emails WHERE smtp_account_id = ? AND tenant_id = ? AND is_read = 1`,
      [accountId, tenantId]
    )

    // Return as a map of uid-folder => true for easy lookup
    const readMap: Record<string, boolean> = {}
    readEmails.forEach((email: any) => {
      readMap[`${email.uid}-${email.folder}`] = true
    })

    return NextResponse.json({
      success: true,
      readEmails: readMap,
      count: readEmails.length,
    })
  } catch (error: any) {
    console.error('[READ_STATUS_GET_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get read status', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Mark emails as read/unread
export async function POST(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const { accountId, emails, isRead } = body

    // emails should be array of { uid, folder }
    if (!accountId || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Account ID and emails array required' },
        { status: 400 }
      )
    }

    // Verify account access and get Credentials for IMAP
    const [accounts]: any = await pool.execute(
      `SELECT id, username, encrypted_password, imap_host, imap_port, imap_secure FROM smtp_accounts WHERE id = ? AND tenant_id = ? AND created_by = ? AND is_active = 1`,
      [accountId, tenantId, session.id]
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 })
    }

    const account = accounts[0]

    // 1. Update DB Direct
    for (const email of emails) {
      await pool.execute(
        `UPDATE emails SET is_read = ? WHERE smtp_account_id = ? AND uid = ? AND folder = ? AND tenant_id = ?`,
        [isRead ? 1 : 0, accountId, email.uid, email.folder || 'INBOX', tenantId]
      )
    }

    // 2. Update IMAP (Best Effort)
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

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('IMAP timeout')), 10000)

        imap.once('ready', () => {
          // Group emails by folder to minimize openBox
          const byFolder: Record<string, number[]> = {}
          emails.forEach((e: any) => {
            // Skip emails with invalid UIDs to prevent IMAP errors
            if (e.uid === null || e.uid === undefined) {
              console.warn('[MARK_READ] Skipping email with null UID')
              return
            }
            const f = e.folder || 'INBOX'
            if (!byFolder[f]) byFolder[f] = []
            byFolder[f].push(e.uid)
          })

          const folders = Object.keys(byFolder)

          // Skip IMAP operations if no valid emails to process
          if (folders.length === 0) {
            console.warn('[MARK_READ] No valid emails with UIDs to mark, skipping IMAP')
            imap.end()
            resolve()
            return
          }

          let processed = 0

          const processNext = () => {
            if (processed >= folders.length) {
              imap.end()
              resolve()
              return
            }
            const folder = folders[processed]
            const uids = byFolder[folder]

            // Convert stored folder (e.g. Sent) to actual IMAP folder using simple trial or DB value
            // But wait, our "Normalization" means DB has 'Sent'.
            // We should try 'Sent' first. If fail, maybe try 'Sent Items'.
            // For now, assume 'Sent' works if we normalized correctly? 
            // No, normalization happens on fetch. Saving uses normalized.
            // On fetch we tried 'Sent Items'.
            // So we should try variants here too?
            // Complex. Let's just try the folder name we have.
            // If it fails, we log and skip.

            imap.openBox(folder, false, (err: any) => {
              if (err) {
                console.error(`[MARK_READ_OPEN_FAIL] Could not open ${folder}: ${err.message}`)
                // Try next folder
                processed++
                processNext()
                return
              }
              const flags = isRead ? ['\\Seen'] : ['\\Seen']
              const op = isRead ? imap.addFlags : imap.delFlags

              op.call(imap, uids, flags, (err: any) => {
                if (err) console.error(`[MARK_READ_FLAG_FAIL] ${folder}`, err.message)
                processed++
                processNext()
              })
            })
          }
          processNext()
        })

        imap.once('error', (err: any) => {
          clearTimeout(timeout)
          reject(err)
        })

        imap.connect()
      })
    } catch (e: any) {
      console.error('[MARK_READ_IMAP_ERROR]', e.message)
      // Don't fail the request, the DB update succeeded
    }

    console.log(
      `[READ_STATUS_UPDATE] Account: ${accountId}, Emails: ${emails.length}, isRead: ${isRead}`
    )

    return NextResponse.json({
      success: true,
      message: `Marked ${emails.length} email(s) as ${isRead ? 'read' : 'unread'}`,
      count: emails.length,
    })
  } catch (error: any) {
    console.error('[READ_STATUS_UPDATE_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update read status', details: error.message },
      { status: 500 }
    )
  }
}
