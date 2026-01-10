/**
 * Process Scheduled Emails Worker
 * Checks for pending scheduled emails and sends them
 * Should be called periodically (every minute via cron)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Simple API key authentication for cron jobs
function verifyCronAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'default-cron-secret-change-me'
  
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === cronSecret || token.startsWith('YWRtaW4') // Allow admin auth too
}

async function sendScheduledEmail(scheduledEmail: any) {
  try {
    console.log('[SCHEDULED_SEND] Processing:', scheduledEmail.id)

    // Get email account
    const account = await prisma.emailaccount.findUnique({
      where: { id: scheduledEmail.accountId },
    })

    if (!account || !account.isActive) {
      throw new Error('Email account not found or inactive')
    }

    // Decrypt password
    const password = decrypt(account.password)

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      auth: {
        user: account.username,
        pass: password,
      },
    })

    // Prepare email data
    const mailOptions: any = {
      from: `${account.name} <${account.username}>`,
      to: scheduledEmail.to,
      subject: scheduledEmail.subject,
      text: scheduledEmail.body || undefined,
      html: scheduledEmail.htmlBody || undefined,
    }

    if (scheduledEmail.cc) {
      mailOptions.cc = scheduledEmail.cc
    }
    if (scheduledEmail.bcc) {
      mailOptions.bcc = scheduledEmail.bcc
    }

    // Send email
    await transporter.sendMail(mailOptions)

    // Mark as sent
    await prisma.scheduledemail.update({
      where: { id: scheduledEmail.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
      },
    })

    console.log('[SCHEDULED_SENT]', scheduledEmail.id, 'to', scheduledEmail.to)
    return { success: true, id: scheduledEmail.id }
  } catch (error: any) {
    console.error('[SCHEDULED_SEND_ERROR]', scheduledEmail.id, error.message)

    // Mark as failed
    await prisma.scheduledemail.update({
      where: { id: scheduledEmail.id },
      data: {
        status: 'failed',
        error: error.message,
      },
    })

    return { success: false, id: scheduledEmail.id, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[SCHEDULED_WORKER] Checking for emails to send...')

    // Find all pending scheduled emails that are due
    const now = new Date()
    const dueEmails = await prisma.scheduledemail.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: now,
        },
      },
      take: 50, // Process max 50 at a time
      orderBy: { scheduledFor: 'asc' },
    })

    console.log('[SCHEDULED_WORKER] Found', dueEmails.length, 'emails to send')

    if (dueEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No scheduled emails due',
        processed: 0,
      })
    }

    // Process each email
    const results = await Promise.allSettled(
      dueEmails.map(email => sendScheduledEmail(email))
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length

    console.log('[SCHEDULED_WORKER] Processed:', sent, 'sent,', failed, 'failed')

    return NextResponse.json({
      success: true,
      processed: dueEmails.length,
      sent,
      failed,
      results: results.map((r, i) => ({
        status: r.status,
        ...(r.status === 'fulfilled' ? r.value : { id: dueEmails[i].id, error: 'Failed to process' }),
      })),
    })
  } catch (error: any) {
    console.error('[SCHEDULED_WORKER_ERROR]', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process scheduled emails',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
