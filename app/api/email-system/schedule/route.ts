/**
 * Scheduled Emails API
 * Schedule emails to send at a specific time
 */

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - List scheduled emails
export async function GET(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status') || 'pending'

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    let query = `
      SELECT * FROM scheduledemail 
      WHERE accountId = ? AND tenant_id = ?
    `
    const params: any[] = [accountId, tenantId]

    if (status) {
      query += ` AND status = ?`
      params.push(status)
    }

    query += ` ORDER BY scheduledFor ASC LIMIT 50`

    const [scheduledEmails]: any = await pool.execute(query, params)

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
  try {
    const { session, tenantId } = await requireTenantAuth(request)
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

    const id = uuidv4()
    const now = new Date()

    await pool.execute(`
      INSERT INTO scheduledemail (
        id, accountId, \`to\`, cc, bcc, subject, body, htmlBody, attachments, scheduledFor, status, retryCount, createdAt, updatedAt, tenant_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      accountId,
      to,
      cc || null,
      bcc || null,
      subject,
      bodyText || null,
      htmlBody || null,
      attachments ? JSON.stringify(attachments) : null,
      scheduleDate,
      'pending',
      0,
      now,
      now,
      tenantId
    ])

    console.log('[EMAIL_SCHEDULED]', id, 'for', scheduleDate)

    return NextResponse.json({
      success: true,
      scheduledEmail: { id, scheduledFor: scheduleDate, status: 'pending' },
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
  try {
    const { session, tenantId } = await requireTenantAuth(request)
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
    const [existing]: any = await pool.execute(
      `SELECT * FROM scheduledemail WHERE id = ? AND tenant_id = ?`,
      [scheduleId, tenantId]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Scheduled email not found' }, { status: 404 })
    }

    if (existing[0].status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot edit already sent email' },
        { status: 400 }
      )
    }

    const updates: string[] = []
    const values: any[] = []

    if (to) { updates.push(`\`to\` = ?`); values.push(to) }
    if (cc !== undefined) { updates.push(`cc = ?`); values.push(cc) }
    if (bcc !== undefined) { updates.push(`bcc = ?`); values.push(bcc) }
    if (subject) { updates.push(`subject = ?`); values.push(subject) }
    if (bodyText !== undefined) { updates.push(`body = ?`); values.push(bodyText) }
    if (htmlBody !== undefined) { updates.push(`htmlBody = ?`); values.push(htmlBody) }
    if (attachments !== undefined) { updates.push(`attachments = ?`); values.push(JSON.stringify(attachments)) }

    if (scheduledFor) {
      const newDate = new Date(scheduledFor)
      if (newDate <= new Date()) {
        return NextResponse.json(
          { error: 'Scheduled time must be in the future' },
          { status: 400 }
        )
      }
      updates.push(`scheduledFor = ?`); values.push(newDate)
    }

    if (updates.length > 0) {
      updates.push(`updatedAt = ?`); values.push(new Date())

      const query = `UPDATE scheduledemail SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`
      values.push(scheduleId, tenantId)

      await pool.execute(query, values)
    }

    console.log('[SCHEDULED_EMAIL_UPDATED]', scheduleId)

    return NextResponse.json({
      success: true,
      message: 'Scheduled email updated'
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
  try {
    const { session, tenantId } = await requireTenantAuth(request)
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
    }

    // Check if already sent
    const [existing]: any = await pool.execute(
      `SELECT * FROM scheduledemail WHERE id = ? AND tenant_id = ?`,
      [scheduleId, tenantId]
    )

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Scheduled email not found' }, { status: 404 })
    }

    if (existing[0].status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot cancel already sent email' },
        { status: 400 }
      )
    }

    // Mark as cancelled
    await pool.execute(
      `UPDATE scheduledemail SET status = 'cancelled', updatedAt = ? WHERE id = ? AND tenant_id = ?`,
      [new Date(), scheduleId, tenantId]
    )

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
