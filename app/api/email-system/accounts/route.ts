import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { encrypt } from '@/lib/smtp-encrypt'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - List all accounts (Tenant Scoped)
export async function GET(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)
    console.log(`[EMAIL_SYSTEM_ACCOUNTS] Fetching for user: ${session.id} in tenant: ${tenantId}`)

    // Tenant-level shared accounts: Show all active accounts for this tenant
    const [accounts]: any = await pool.execute(`
      SELECT id, name, from_email as email
      FROM smtp_accounts
      WHERE tenant_id = ? AND created_by = ? AND is_active = 1
      ORDER BY id DESC
    `, [tenantId, session.id])

    console.log(`[ACCOUNTS_DBG] Query: tenant=${tenantId}. Found: ${accounts.length}`)

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('[EMAIL_SYSTEM_ACCOUNTS_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new account (User Scoped)
export async function POST(request: NextRequest) {
  try {
    const { session, tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const {
      name,
      email,
      username,
      password,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      provider,
      from_name,
      from_email
    } = body

    // Validate required fields
    if (!name || !email || !username || !password || !imapHost || !smtpHost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify Credentials (unless skipVerification is passed - handled in frontend by not checking? Frontend calls this API. 
    // Wait, frontend DOES verify by default. If skipVerification is passed, we might want to skip this?
    // User form has 'skipVerification'.

    if (!body.skipVerification) {
      const { verifySmtp, verifyImap } = await import('@/lib/email-verifier');

      console.log('[VERIFY] Checking SMTP:', smtpHost);
      const smtpCheck = await verifySmtp({
        host: smtpHost,
        port: smtpPort || 587,
        secure: smtpSecure !== false, // Default true
        user: username,
        pass: password
      });

      if (!smtpCheck.success) {
        return NextResponse.json({ error: `SMTP Connection Failed: ${smtpCheck.error}` }, { status: 400 });
      }

      console.log('[VERIFY] Checking IMAP:', imapHost);
      const imapCheck = await verifyImap({
        host: imapHost,
        port: imapPort || 993,
        secure: imapSecure !== false,
        user: username,
        pass: password
      });

      if (!imapCheck.success) {
        return NextResponse.json({ error: `IMAP Connection Failed: ${imapCheck.error}` }, { status: 400 });
      }
    }

    // Encrypt password
    const encryptedPassword = encrypt(password)


    // Create account with created_by for user-level isolation
    const [result]: any = await pool.execute(`
      INSERT INTO smtp_accounts 
      (tenant_id, created_by, name, provider, host, port, username, encrypted_password, from_email, from_name, imap_host, imap_port, is_active, imap_secure, imap_user, signature_html_content, use_signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `, [
      tenantId,
      session.id, // User-level ownership
      name,
      provider || 'custom',
      smtpHost,
      smtpPort || 587,
      username,
      encryptedPassword,
      from_email || email,
      from_name || name,
      imapHost,
      imapPort || 993,
      imapSecure ? 1 : 0,
      username,
      body.signature_html || null,
      body.use_signature ? 1 : 0
    ])

    const insertId = result.insertId

    console.log('[ACCOUNT_CREATED]', email, 'for user', session.id, 'in tenant', tenantId)

    return NextResponse.json({
      success: true,
      account: {
        id: insertId.toString(),
        name: name,
        email: email,
      }
    })
  } catch (error: any) {
    console.error('[ACCOUNT_CREATE_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({
      error: 'Failed to create account',
      details: error.message
    }, { status: 500 })
  }
}
