import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import pool from '@/lib/db'
import { requireTenantAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// System Templates
const SYSTEM_TEMPLATES = [
  {
    id: 'sys-welcome',
    name: 'Welcome Email',
    subject: 'Welcome to the Family!',
    body: 'Hi there,\n\nWe are thrilled to have you with us. Let us know if you need anything.\n\nBest,\nThe Team',
    htmlBody: '<div style="font-family: sans-serif;"><h2>Welcome!</h2><p>We are thrilled to have you with us.</p><p>Let us know if you need anything.</p><br><p>Best,</p><p><strong>The Team</strong></p></div>',
    category: 'Onboarding',
    isShared: true,
    usageCount: 0,
    lastUsed: null,
    accountId: 'system',
    tenantId: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sys-meeting',
    name: 'Meeting Follow-up',
    subject: 'Great meeting you today',
    body: 'Hi,\n\nThanks for your time today. It was great discussing the project.\n\nLooking forward to next steps.\n\nRegards,',
    htmlBody: '<div style="font-family: sans-serif;"><p>Hi,</p><p>Thanks for your time today. It was great discussing the project.</p><p>Looking forward to next steps.</p><br><p>Regards,</p></div>',
    category: 'Business',
    isShared: true,
    usageCount: 0,
    lastUsed: null,
    accountId: 'system',
    tenantId: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sys-update',
    name: 'Weekly Update',
    subject: 'Weekly Project Update',
    body: 'Team,\n\nHere is the progress for this week:\n\n- Task A: Done\n- Task B: In Progress\n\nPlan for next week:\n- Task C\n\nCheers,',
    htmlBody: '<div style="font-family: sans-serif;"><h3>Weekly Update</h3><p>Team,</p><p>Here is the progress for this week:</p><ul><li>Task A: Done</li><li>Task B: In Progress</li></ul><p><strong>Plan for next week:</strong></p><ul><li>Task C</li></ul><p>Cheers,</p></div>',
    category: 'Updates',
    isShared: true,
    usageCount: 0,
    lastUsed: null,
    accountId: 'system',
    tenantId: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// GET - List all templates for account (Tenant Scoped) + System Templates
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const category = searchParams.get('category')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    // Determine filter logic:
    // Tenant ID MUST match.
    // AND (Account ID matches OR IsShared is true)
    const where: any = {
      tenantId: tenantId, // Enforce tenant scope
      OR: [
        { accountId },
        { isShared: true }
      ],
    }

    if (category) {
      where.category = category
    }

    const dbTemplates = await prisma.emailtemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { name: 'asc' }],
    })

    // Filter system templates if category is specified
    const filteredSystemTemplates = category
      ? SYSTEM_TEMPLATES.filter(t => t.category === category)
      : SYSTEM_TEMPLATES

    const templates = [...filteredSystemTemplates, ...dbTemplates]

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error: any) {
    console.error('[TEMPLATES_GET_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to get templates', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new template (Tenant Scoped)
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const { accountId, name, subject, bodyText, htmlBody, category, isShared } = body

    if (!accountId || !name) {
      return NextResponse.json(
        { error: 'Account ID and name required' },
        { status: 400 }
      )
    }

    // Verify account ownership using smtp_accounts
    const [accounts]: any = await pool.execute(
      `SELECT id FROM smtp_accounts WHERE id = ? AND tenant_id = ? AND is_active = 1`,
      [accountId, tenantId]
    )

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Account not found or access denied' }, { status: 404 })
    }

    const template = await prisma.emailtemplate.create({
      data: {
        tenantId, // Add tenantId
        accountId: String(accountId),
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
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update template (Tenant Scoped)
export async function PATCH(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const { templateId, name, subject, bodyText, htmlBody, category, isShared } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if system template
    if (templateId.startsWith('sys-')) {
      return NextResponse.json({ error: 'Cannot modify system templates' }, { status: 403 })
    }

    // Verify template existence and access
    const existingTemplate = await prisma.emailtemplate.findFirst({
      where: { id: templateId, tenantId: tenantId }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 })
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
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete template (Tenant Scoped)
export async function DELETE(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if system template
    if (templateId.startsWith('sys-')) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 })
    }

    // Delete with tenant check
    const result = await prisma.emailtemplate.deleteMany({
      where: {
        id: templateId,
        tenantId: tenantId
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 })
    }

    console.log('[TEMPLATE_DELETED]', templateId)

    return NextResponse.json({
      success: true,
      message: 'Template deleted',
    })
  } catch (error: any) {
    console.error('[TEMPLATE_DELETE_ERROR]', error.message)
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Use template (increment usage count) (Tenant Scoped)
export async function PUT(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantAuth(request)

    const body = await request.json()
    const { templateId } = body

    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    // Check if system template - just return success without DB lookup
    if (templateId.startsWith('sys-')) {
      return NextResponse.json({
        success: true,
        template: SYSTEM_TEMPLATES.find(t => t.id === templateId) || {}
      })
    }

    // Verify access
    const existingTemplate = await prisma.emailtemplate.findFirst({
      where: { id: templateId, tenantId: tenantId }
    })

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found or access denied' }, { status: 404 })
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
    if (error.message.includes('Tenant context required') || error.message.includes('Access denied')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Failed to record template usage', details: error.message },
      { status: 500 }
    )
  }
}
