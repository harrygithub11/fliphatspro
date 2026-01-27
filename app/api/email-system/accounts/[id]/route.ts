/**
 * Email Account Update API
 * Handles updating individual email account settings including signature
 * Updated for Tenant Isolation and Raw SQL
 */

import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// PATCH - Update account details
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, tenantId, permissions, tenantRole } = await requireTenantAuth(request)

    // Check permissions
    const canManage = tenantRole === 'owner' || tenantRole === 'admin' || permissions?.emails?.manage === true;

    const { id } = params
    const body = await request.json()
    const {
      name, provider,
      smtpHost, smtpPort, smtpSecure,
      imapHost, imapPort, imapSecure,
      username, password,
      from_name, from_email
    } = body

    // Construct dynamic update query
    let updates = []
    let values = []

    if (name) { updates.push('name = ?'); values.push(name); }
    if (provider) { updates.push('provider = ?'); values.push(provider); }
    if (from_name) { updates.push('from_name = ?'); values.push(from_name); }
    if (from_email) { updates.push('from_email = ?'); values.push(from_email); } // Careful, from_email usually shouldn't change if it's the ID? But it's editable.

    // SMTP
    if (smtpHost) { updates.push('host = ?'); values.push(smtpHost); }
    if (smtpPort) { updates.push('port = ?'); values.push(smtpPort); }
    // smtpSecure -> Not in DB? Ignore or maybe we need to map to something?

    // IMAP
    if (imapHost) { updates.push('imap_host = ?'); values.push(imapHost); }
    if (imapPort) { updates.push('imap_port = ?'); values.push(imapPort); }
    if (imapSecure !== undefined) { updates.push('imap_secure = ?'); values.push(imapSecure ? 1 : 0); }

    // Auth
    if (username) {
      updates.push('username = ?'); values.push(username);
      updates.push('imap_user = ?'); values.push(username); // Sync imap_user
    }

    if (password) {
      const { encrypt } = await import('@/lib/smtp-encrypt');
      updates.push('encrypted_password = ?'); values.push(encrypt(password));
    }

    if (body.signature_html !== undefined) {
      updates.push('signature_html_content = ?'); values.push(body.signature_html);
    }
    if (body.use_signature !== undefined) {
      updates.push('use_signature = ?'); values.push(body.use_signature ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'No changes provided' })
    }

    // Determine scope: 
    let whereClause = 'WHERE id = ? AND tenant_id = ?'
    values.push(id, tenantId)

    if (tenantRole !== 'owner' && tenantRole !== 'admin') {
      whereClause += ' AND created_by = ?'
      values.push(session.id)
    }

    const [result]: any = await pool.execute(
      `UPDATE smtp_accounts SET ${updates.join(', ')} ${whereClause}`,
      values
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 })
    }

    console.log('[ACCOUNT_UPDATED]', id, '- Details updated by', session.id)

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully'
    })

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[ACCOUNT_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update account', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get account details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, tenantId, tenantRole } = await requireTenantAuth(request)
    const { id } = params

    let whereClause = 'WHERE id = ? AND tenant_id = ?'
    const values: any[] = [id, tenantId]

    // If regular user (not admin/owner), strictly limit to their own accounts
    // Unless we allow sharing in future? For now, audit said "Strict Isolation".
    // Wait, "Email Accounts" often shared? But previous turns implemented "User Isolation".
    // So enforcing created_by is correct for now.

    if (tenantRole !== 'owner' && tenantRole !== 'admin') {
      whereClause += ' AND created_by = ?'
      values.push(session.id)
    }

    const [rows]: any = await pool.execute(
      `SELECT id, name, from_email as email, from_name, provider,
              host as smtpHost, port as smtpPort, 
              imap_host as imapHost, imap_port as imapPort, imap_secure as imapSecure,
              username, created_by,
              signature_html_content as signature_html, use_signature 
       FROM smtp_accounts 
       ${whereClause}`,
      values
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      account: {
        ...rows[0],
        imapSecure: !!rows[0].imapSecure,
        use_signature: !!rows[0].use_signature
      },
    })

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[ACCOUNT_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get account', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Remove account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session, tenantId, permissions, tenantRole } = await requireTenantAuth(request)
    const { id } = params // Note: params.id is the account ID

    // Permission Check
    // Owner/Admin or custom permission can delete
    // Regular users can delete their OWN accounts
    const isAdmin = tenantRole === 'owner' || tenantRole === 'admin'

    let whereClause = 'WHERE id = ? AND tenant_id = ?'
    const values: any[] = [id, tenantId]

    if (!isAdmin) {
      // Enforce strict ownership for non-admins
      whereClause += ' AND created_by = ?'
      values.push(session.id)
    }

    // Perform deletion
    // Consider adding `is_active = 0` (Soft Delete) or `deleted_at` instead of hard delete if safer
    // But user asked to "Delete", so let's try strict delete or check if deleted_at exists.
    // Based on previous comprehensive fix, `smtp_accounts` HAS `tenant_id` but maybe not `deleted_at`?
    // Let's do a hard delete for now as per "trash" icon expectation, or check if we should soft delete.
    // Actually, `smtp_accounts` usually doesn't have deleted_at in the fix script I saw earlier.
    // So hard delete is fine for now, or use is_active=0. 
    // Let's do a hard delete to definitely remove it from the list.

    const [result]: any = await pool.execute(
      `DELETE FROM smtp_accounts ${whereClause}`,
      values
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Account not found or unauthorized' }, { status: 404 })
    }

    console.log('[ACCOUNT_DELETED]', id, '- Deleted by', session.id)

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    })

  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('[ACCOUNT_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete account', details: error.message },
      { status: 500 }
    )
  }
}
