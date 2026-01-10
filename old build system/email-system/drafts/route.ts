/**
 * Email Drafts API
 * Handles draft email CRUD operations with auto-save support
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all drafts for an account
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

    const drafts = await prisma.emaildraft.findMany({
      where: { accountId },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limit to 50 most recent drafts
    })

    console.log(`[DRAFTS_LIST] Found ${drafts.length} drafts for account ${accountId}`)

    return NextResponse.json({
      success: true,
      drafts,
      count: drafts.length,
    })
  } catch (error: any) {
    console.error('[DRAFTS_LIST_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to list drafts', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update a draft
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
      // Update existing draft
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
    return NextResponse.json(
      { error: 'Failed to save draft', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete a draft
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
    }

    await prisma.emaildraft.delete({
      where: { id },
    })

    console.log('[DRAFT_DELETED]', id)

    return NextResponse.json({
      success: true,
      message: 'Draft deleted',
    })
  } catch (error: any) {
    console.error('[DRAFT_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete draft', details: error.message },
      { status: 500 }
    )
  }
}
