import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
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

    console.log(`[INBOX_CACHE] Loading emails for account: ${accountId}`)

    // Get cached emails (both inbox and sent)
    const emails = await prisma.cachedemail.findMany({
      where: { accountId },
      orderBy: { date: 'desc' },
      take: limit,
    })

    // Transform to match expected format
    const transformedEmails = emails.map(email => ({
      uid: email.uid,
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.textSnippet,
      htmlContent: email.htmlContent || undefined,
      date: email.date.toISOString(),
      folder: email.folder || 'INBOX', // Handle old records without folder
      hasAttachments: email.hasAttachments || false,
      attachmentCount: email.attachmentCount || 0,
    }))

    console.log(`[INBOX_CACHE_SUCCESS] Returning ${transformedEmails.length} cached emails`)

    return NextResponse.json({
      success: true,
      emails: transformedEmails,
      count: transformedEmails.length,
      cached: true,
    })
  } catch (error: any) {
    console.error('[INBOX_CACHE_ERROR]', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load cached emails',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
