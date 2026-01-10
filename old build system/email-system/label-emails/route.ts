/**
 * Email Labeling API
 * Assign/remove labels from emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - Get labels for emails
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

    const labelings = await prisma.emaillabeling.findMany({
      where: { accountId },
    })

    // Group by email
    const emailLabels: Record<string, string[]> = {}
    labelings.forEach(labeling => {
      const key = `${labeling.emailUid}-${labeling.emailFolder}`
      if (!emailLabels[key]) {
        emailLabels[key] = []
      }
      emailLabels[key].push(labeling.labelId)
    })

    return NextResponse.json({
      success: true,
      emailLabels,
    })
  } catch (error: any) {
    console.error('[EMAIL_LABELS_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get email labels', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Assign label to email(s)
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, emails, labelId, action } = body

    // emails: [{ uid, folder }]
    // action: 'add' or 'remove'

    if (!accountId || !Array.isArray(emails) || !labelId) {
      return NextResponse.json(
        { error: 'Account ID, emails array, and label ID required' },
        { status: 400 }
      )
    }

    if (action === 'add') {
      // Add labels
      const operations = emails.map(email =>
        prisma.emaillabeling.upsert({
          where: {
            accountId_emailUid_emailFolder_labelId: {
              accountId,
              emailUid: email.uid,
              emailFolder: email.folder || 'INBOX',
              labelId,
            },
          },
          update: {},
          create: {
            accountId,
            emailUid: email.uid,
            emailFolder: email.folder || 'INBOX',
            labelId,
          },
        })
      )

      await prisma.$transaction(operations)

      console.log(`[LABEL_ADDED] ${emails.length} emails labeled with ${labelId}`)

      return NextResponse.json({
        success: true,
        message: `Added label to ${emails.length} email(s)`,
      })
    } else if (action === 'remove') {
      // Remove labels
      await prisma.emaillabeling.deleteMany({
        where: {
          accountId,
          labelId,
          OR: emails.map(email => ({
            emailUid: email.uid,
            emailFolder: email.folder || 'INBOX',
          })),
        },
      })

      console.log(`[LABEL_REMOVED] ${emails.length} emails unlabeled from ${labelId}`)

      return NextResponse.json({
        success: true,
        message: `Removed label from ${emails.length} email(s)`,
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[EMAIL_LABEL_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update email labels', details: error.message },
      { status: 500 }
    )
  }
}
