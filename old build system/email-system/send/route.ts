/**
 * Email Sending API
 * Sends emails via SMTP using configured email accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'
import nodemailer from 'nodemailer'
import Imap from 'imap'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  const token = authHeader.replace('Bearer ', '')
  return token.startsWith('YWRtaW4')
}

// Function to save sent email to IMAP Sent folder
async function saveToSentFolder(account: any, password: string, mailContent: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: account.username,
      password: password,
      host: account.imapHost,
      port: account.imapPort,
      tls: account.imapSecure,
      tlsOptions: { rejectUnauthorized: false },
    })

    imap.once('ready', () => {
      // Open Sent folder (try multiple common names)
      const sentFolders = ['Sent', 'INBOX.Sent', '[Gmail]/Sent Mail', 'Sent Items', 'Sent Messages']
      
      const tryFolder = (index: number) => {
        if (index >= sentFolders.length) {
          console.log('[IMAP_SENT] No Sent folder found, using INBOX')
          imap.openBox('INBOX', false, (err, box) => {
            if (err) {
              imap.end()
              return reject(err)
            }
            appendMessage()
          })
          return
        }

        imap.openBox(sentFolders[index], false, (err, box) => {
          if (err) {
            // Try next folder name
            tryFolder(index + 1)
          } else {
            console.log(`[IMAP_SENT] Using folder: ${sentFolders[index]}`)
            appendMessage()
          }
        })
      }

      const appendMessage = () => {
        imap.append(mailContent, { flags: ['\\Seen'] }, (err) => {
          imap.end()
          if (err) {
            console.error('[IMAP_APPEND_ERROR]', err.message)
            reject(err)
          } else {
            console.log('[IMAP_SENT_SAVED] Email saved to Sent folder')
            resolve()
          }
        })
      }

      tryFolder(0)
    })

    imap.once('error', (err: any) => {
      console.error('[IMAP_SENT_ERROR]', err.message)
      reject(err)
    })

    imap.connect()
  })
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, to, subject, text, html, attachments } = body

    // Validation
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    if (!to || !subject) {
      return NextResponse.json(
        { error: 'Recipient (to) and subject are required' },
        { status: 400 }
      )
    }

    if (!text && !html) {
      return NextResponse.json(
        { error: 'Either text or html content is required' },
        { status: 400 }
      )
    }

    // Get account from database
    const account = await prisma.emailaccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
    }

    if (!account.isActive) {
      return NextResponse.json({ error: 'Email account is disabled' }, { status: 400 })
    }

    // Decrypt password
    let decryptedPassword: string
    try {
      decryptedPassword = decrypt(account.password)
    } catch (error) {
      console.error('[PASSWORD_DECRYPT_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to decrypt account password. Check ENCRYPTION_KEY.' },
        { status: 500 }
      )
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure, // true for 465, false for other ports
      auth: {
        user: account.username,
        pass: decryptedPassword,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
      console.log(`[SMTP_CONNECTED] ${account.email}`)
    } catch (error: any) {
      console.error('[SMTP_VERIFY_ERROR]', error)
      return NextResponse.json(
        {
          error: 'SMTP connection failed',
          details: error.message,
          suggestion: 'Check SMTP host, port, and credentials',
        },
        { status: 500 }
      )
    }

    // Prepare email options
    const mailOptions: any = {
      from: `"${account.name}" <${account.email}>`,
      to,
      subject,
      text: text || (html ? html.replace(/<[^>]*>/g, '') : ''),
      html: html || text,
    }

    // Add attachments if present
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      mailOptions.attachments = attachments.map((att: any) => ({
        filename: att.filename,
        content: att.data,
        encoding: 'base64',
        contentType: att.contentType,
      }))
      console.log(`[EMAIL_ATTACHMENTS] ${attachments.length} file(s)`)
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log(`[EMAIL_SENT] From: ${account.email}, To: ${to}, MessageID: ${info.messageId}`)
    
    // Save to IMAP Sent folder (so it appears in webmail)
    try {
      // Build RFC822 message
      const date = new Date().toUTCString()
      const boundary = '----=_Part_' + Date.now()
      
      let rfcMessage = `From: "${account.name}" <${account.email}>\r\n`
      rfcMessage += `To: ${to}\r\n`
      rfcMessage += `Subject: ${subject}\r\n`
      rfcMessage += `Date: ${date}\r\n`
      rfcMessage += `Message-ID: <${info.messageId}>\r\n`
      rfcMessage += `MIME-Version: 1.0\r\n`
      
      if (html) {
        rfcMessage += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n`
        rfcMessage += `--${boundary}\r\n`
        rfcMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`
        rfcMessage += text || html.replace(/<[^>]*>/g, '') + '\r\n\r\n'
        rfcMessage += `--${boundary}\r\n`
        rfcMessage += `Content-Type: text/html; charset="UTF-8"\r\n\r\n`
        rfcMessage += html + '\r\n\r\n'
        rfcMessage += `--${boundary}--\r\n`
      } else {
        rfcMessage += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`
        rfcMessage += text + '\r\n'
      }

      await saveToSentFolder(account, decryptedPassword, rfcMessage)
      console.log('[IMAP_SAVED] Email saved to Sent folder in webmail')
    } catch (imapError: any) {
      console.error('[IMAP_SAVE_ERROR]', imapError.message)
      // Don't fail the send if IMAP save fails
    }
    
    // Save sent email to database immediately for instant display
    try {
      const uniqueId = `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const hasAttachments = attachments && attachments.length > 0
      
      await prisma.cachedemail.create({
        data: {
          id: uniqueId,
          accountId: accountId,
          uid: Math.floor(Math.random() * 2147483647), // Random INT within MySQL INT range
          folder: 'Sent',
          from: account.email,
          to: to,
          subject: subject,
          textSnippet: text ? text.substring(0, 1000) : (html ? html.replace(/<[^>]*>/g, '').substring(0, 1000) : ''),
          htmlContent: html || null,
          date: new Date(),
          hasAttachments: hasAttachments,
          attachmentCount: hasAttachments ? attachments.length : 0,
        }
      })
      
      console.log(`[EMAIL_CACHED] Sent email saved to database`)
      
      // Update analytics
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      await prisma.emailanalytics.upsert({
        where: {
          accountId_date: {
            accountId: accountId,
            date: today,
          },
        },
        update: {
          emailsSent: { increment: 1 },
        },
        create: {
          accountId: accountId,
          date: today,
          emailsSent: 1,
          emailsReceived: 0,
          emailsRead: 0,
        },
      })
      
      console.log(`[ANALYTICS_UPDATED] Sent count incremented`)
    } catch (cacheError: any) {
      console.error('[EMAIL_CACHE_ERROR]', cacheError.message)
      // Don't fail the send if caching fails
    }

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      from: account.email,
      to,
      subject,
    })
  } catch (error: any) {
    console.error('[SEND_EMAIL_ERROR]', error)
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: error.message,
        code: error.code || 'UNKNOWN',
      },
      { status: 500 }
    )
  }
}
