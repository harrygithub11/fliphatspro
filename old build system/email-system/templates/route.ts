/**
 * Email Templates API
 * Create and manage reusable email templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all templates for account
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const category = searchParams.get('category')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const where: any = {
      OR: [{ accountId }, { isShared: true }],
    }

    if (category) {
      where.category = category
    }

    const templates = await prisma.emailtemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error: any) {
    console.error('[TEMPLATES_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, name, subject, bodyText, htmlBody, category, isShared } = body

    if (!accountId || !name) {
      return NextResponse.json(
        { error: 'Account ID and name required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailtemplate.create({
      data: {
        accountId,
        name,
        subject: subject || null,
        body: bodyText || null,
        htmlBody: htmlBody || null,
        category: category || null,
        isShared: isShared || false,
      },
    })

    console.log('[TEMPLATE_CREATED]', template.name)

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error: any) {
    console.error('[TEMPLATE_CREATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update template
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { templateId, name, subject, bodyText, htmlBody, category, isShared } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const template = await prisma.emailtemplate.update({
      where: { id: templateId },
      data: {
        name: name || undefined,
        subject: subject !== undefined ? subject : undefined,
        body: bodyText !== undefined ? bodyText : undefined,
        htmlBody: htmlBody !== undefined ? htmlBody : undefined,
        category: category !== undefined ? category : undefined,
        isShared: isShared !== undefined ? isShared : undefined,
      },
    })

    console.log('[TEMPLATE_UPDATED]', template.name)

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error: any) {
    console.error('[TEMPLATE_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    await prisma.emailtemplate.delete({
      where: { id: templateId },
    })

    console.log('[TEMPLATE_DELETED]', templateId)

    return NextResponse.json({
      success: true,
      message: 'Template deleted',
    })
  } catch (error: any) {
    console.error('[TEMPLATE_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Use template (increment usage count)
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const template = await prisma.emailtemplate.update({
      where: { id: templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsed: new Date(),
      },
    })

    console.log('[TEMPLATE_USED]', template.name)

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error: any) {
    console.error('[TEMPLATE_USE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to record template usage', details: error.message },
      { status: 500 }
    )
  }
}
