/**
 * Email Read Status API
 * Tracks read/unread status per account across devices
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - Get read status for account
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const readStatuses = await prisma.emailreadstatus.findMany({
      where: { 
        accountId,
        isRead: true 
      },
      select: {
        emailUid: true,
        emailFolder: true,
      },
    })

    // Return as a map of uid-folder => true for easy lookup
    const readMap: Record<string, boolean> = {}
    readStatuses.forEach(status => {
      readMap[`${status.emailUid}-${status.emailFolder}`] = true
    })

    return NextResponse.json({
      success: true,
      readEmails: readMap,
      count: readStatuses.length,
    })
  } catch (error: any) {
    console.error('[READ_STATUS_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get read status', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Mark emails as read/unread
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, emails, isRead } = body

    // emails should be array of { uid, folder }
    if (!accountId || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Account ID and emails array required' },
        { status: 400 }
      )
    }

    const operations = []

    for (const email of emails) {
      if (isRead) {
        // Mark as read - upsert
        operations.push(
          prisma.emailreadstatus.upsert({
            where: {
              accountId_emailUid_emailFolder: {
                accountId,
                emailUid: email.uid,
                emailFolder: email.folder || 'INBOX',
              },
            },
            update: {
              isRead: true,
              readAt: new Date(),
            },
            create: {
              accountId,
              emailUid: email.uid,
              emailFolder: email.folder || 'INBOX',
              isRead: true,
            },
          })
        )
      } else {
        // Mark as unread - delete record
        operations.push(
          prisma.emailreadstatus.deleteMany({
            where: {
              accountId,
              emailUid: email.uid,
              emailFolder: email.folder || 'INBOX',
            },
          })
        )
      }
    }

    await prisma.$transaction(operations)

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
    return NextResponse.json(
      { error: 'Failed to update read status', details: error.message },
      { status: 500 }
    )
  }
}
