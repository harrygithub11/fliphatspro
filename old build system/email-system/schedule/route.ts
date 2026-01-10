/**
 * Scheduled Emails API
 * Schedule emails to send at a specific time
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List scheduled emails
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status') || 'pending'

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const where: any = { accountId }
    if (status) {
      where.status = status
    }

    const scheduledEmails = await prisma.scheduledemail.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      scheduledEmails,
      count: scheduledEmails.length,
    })
  } catch (error: any) {
    console.error('[SCHEDULED_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get scheduled emails', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Schedule new email
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      accountId,
      to,
      cc,
      bcc,
      subject,
      bodyText,
      htmlBody,
      attachments,
      scheduledFor,
    } = body

    if (!accountId || !to || !subject || !scheduledFor) {
      return NextResponse.json(
        { error: 'Account ID, to, subject, and scheduledFor required' },
        { status: 400 }
      )
    }

    // Validate scheduled time is in future
    const scheduleDate = new Date(scheduledFor)
    if (scheduleDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    const scheduledEmail = await prisma.scheduledemail.create({
      data: {
        accountId,
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        body: bodyText || null,
        htmlBody: htmlBody || null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        scheduledFor: scheduleDate,
        status: 'pending',
      },
    })

    console.log('[EMAIL_SCHEDULED]', scheduledEmail.id, 'for', scheduleDate)

    return NextResponse.json({
      success: true,
      scheduledEmail,
    })
  } catch (error: any) {
    console.error('[SCHEDULE_CREATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to schedule email', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update scheduled email (before sending)
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      scheduleId,
      to,
      cc,
      bcc,
      subject,
      bodyText,
      htmlBody,
      attachments,
      scheduledFor,
    } = body

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
    }

    // Check if already sent
    const existing = await prisma.scheduledemail.findUnique({
      where: { id: scheduleId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scheduled email not found' }, { status: 404 })
    }

    if (existing.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot edit already sent email' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (to) updateData.to = to
    if (cc !== undefined) updateData.cc = cc
    if (bcc !== undefined) updateData.bcc = bcc
    if (subject) updateData.subject = subject
    if (bodyText !== undefined) updateData.body = bodyText
    if (htmlBody !== undefined) updateData.htmlBody = htmlBody
    if (attachments !== undefined) updateData.attachments = JSON.stringify(attachments)
    if (scheduledFor) {
      const newDate = new Date(scheduledFor)
      if (newDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
      updateData.scheduledFor = newDate
    }

    const scheduledEmail = await prisma.scheduledemail.update({
      where: { id: scheduleId },
      data: updateData,
    })

    console.log('[SCHEDULED_EMAIL_UPDATED]', scheduleId)

    return NextResponse.json({
      success: true,
      scheduledEmail,
    })
  } catch (error: any) {
    console.error('[SCHEDULE_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update scheduled email', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Cancel scheduled email
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
    }

    // Check if already sent
    const existing = await prisma.scheduledemail.findUnique({
      where: { id: scheduleId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Scheduled email not found' }, { status: 404 })
    }

    if (existing.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot cancel already sent email' },
        { status: 400 }
      )
    }

    // Mark as cancelled instead of deleting
    await prisma.scheduledemail.update({
      where: { id: scheduleId },
      data: { status: 'cancelled' },
    })

    console.log('[SCHEDULED_EMAIL_CANCELLED]', scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Scheduled email cancelled',
    })
  } catch (error: any) {
    console.error('[SCHEDULE_CANCEL_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to cancel scheduled email', details: error.message },
      { status: 500 }
    )
  }
}
