/**
 * Email Analytics API
 * Track and display email statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - Get analytics for account
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const analytics = await prisma.emailanalytics.findMany({
      where: {
        accountId,
        date: { gte: startDate },
      },
      orderBy: { date: 'desc' },
    })

    // Calculate totals
    const totals = analytics.reduce(
      (acc, day) => ({
        sent: acc.sent + day.emailsSent,
        received: acc.received + day.emailsReceived,
        read: acc.read + day.emailsRead,
      }),
      { sent: 0, received: 0, read: 0 }
    )

    // Calculate averages
    const avgSent = Math.round(totals.sent / Math.max(days, 1))
    const avgReceived = Math.round(totals.received / Math.max(days, 1))
    const readRate = totals.received > 0 ? Math.round((totals.read / totals.received) * 100) : 0

    return NextResponse.json({
      success: true,
      analytics,
      totals,
      averages: {
        sentPerDay: avgSent,
        receivedPerDay: avgReceived,
        readRate,
      },
    })
  } catch (error: any) {
    console.error('[ANALYTICS_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Record analytics
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, date, emailsSent, emailsReceived, emailsRead } = body

    if (!accountId || !date) {
      return NextResponse.json(
        { error: 'Account ID and date required' },
        { status: 400 }
      )
    }

    const analytics = await prisma.emailanalytics.upsert({
      where: {
        accountId_date: {
          accountId,
          date: new Date(date),
        },
      },
      update: {
        emailsSent: emailsSent !== undefined ? { increment: emailsSent } : undefined,
        emailsReceived: emailsReceived !== undefined ? { increment: emailsReceived } : undefined,
        emailsRead: emailsRead !== undefined ? { increment: emailsRead } : undefined,
      },
      create: {
        accountId,
        date: new Date(date),
        emailsSent: emailsSent || 0,
        emailsReceived: emailsReceived || 0,
        emailsRead: emailsRead || 0,
      },
    })

    return NextResponse.json({
      success: true,
      analytics,
    })
  } catch (error: any) {
    console.error('[ANALYTICS_POST_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to record analytics', details: error.message },
      { status: 500 }
    )
  }
}
