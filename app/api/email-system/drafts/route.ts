import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - List all drafts for an account (Tenant Scoped)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const drafts = await prisma.emaildraft.findMany({
      where: {
        accountId,
        tenantId: tenantId // Enforce tenant isolation
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    console.log(`[DRAFTS_LIST] Found ${drafts.length} drafts for account ${accountId} (Tenant: ${tenantId})`)

    return NextResponse.json({
      success: true,
      drafts,
      count: drafts.length,
    })
  } catch (error: any) {
    console.error('[DRAFTS_LIST_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to list drafts', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update a draft (Tenant Scoped)
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const {
      id, // if updating existing draft
      accountId,
      to,
      cc,
      bcc,
      subject,
      body: draftBody,
      htmlBody,
      hasAttachments,
    } = body

    // Validation
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Verify account belongs to tenant using smtp_accounts
    const [accounts]: any = await pool.execute(
      `SELECT id FROM smtp_accounts WHERE id = ? AND tenant_id = ? AND is_active = 1`,
      [accountId, tenantId]
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 })
    }

    // Check if draft is empty (no point saving)
    const isEmpty = !to && !cc && !bcc && !subject && !draftBody && !htmlBody
    if (isEmpty) {
      console.log('[DRAFT_SAVE_SKIPPED] Empty draft')
      return NextResponse.json({
        success: true,
        message: 'Empty draft not saved',
        draft: null,
      })
    }

    let draft

    if (id) {
      // Update existing draft (Verify access)
      const existingDraft = await prisma.emaildraft.findFirst({
        where: { id, tenantId: tenantId }
      })

      if (!existingDraft) {
        return NextResponse.json({ error: 'Draft not found or access denied' }, { status: 404 })
      }

      draft = await prisma.emaildraft.update({
        where: { id },
        data: {
          to: to || null,
          cc: cc || null,
          bcc: bcc || null,
          subject: subject || null,
          body: draftBody || null,
          htmlBody: htmlBody || null,
          hasAttachments: hasAttachments || false,
          updatedAt: new Date(),
        },
      })
      console.log('[DRAFT_UPDATED]', id)
    } else {
      // Create new draft
      draft = await prisma.emaildraft.create({
        data: {
          tenantId, // Add tenantId
          accountId,
          to: to || null,
          cc: cc || null,
          bcc: bcc || null,
          subject: subject || null,
          body: draftBody || null,
          htmlBody: htmlBody || null,
          hasAttachments: hasAttachments || false,
        },
      })
      console.log('[DRAFT_CREATED]', draft.id)
    }

    return NextResponse.json({
      success: true,
      message: id ? 'Draft updated' : 'Draft created',
      draft,
    })
  } catch (error: any) {
    console.error('[DRAFT_SAVE_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to save draft', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a draft (Tenant Scoped)
export async function DELETE(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
    }

    // Verify access before delete (Implicitly via deleteMany with tenantId, or findFirst)
    // Using deleteMany is safer to ensure tenant scoping even if ID is known
    const result = await prisma.emaildraft.deleteMany({
      where: {
        id,
        tenantId: tenantId
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Draft not found or access denied' }, { status: 404 })
    }

    console.log('[DRAFT_DELETED]', id)

    return NextResponse.json({
      success: true,
      message: 'Draft deleted',
    })
  } catch (error: any) {
    console.error('[DRAFT_DELETE_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete draft', details: error.message },
      { status: 500 }
    )
  }
}
