/**
 * Email Rules API
 * Automation rules for emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all rules
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

    const rules = await prisma.emailrule.findMany({
      where: { accountId },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      rules,
      count: rules.length,
    })
  } catch (error: any) {
    console.error('[RULES_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get rules', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new rule
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, name, enabled, priority, conditions, actions } = body

    if (!accountId || !name || !conditions || !actions) {
      return NextResponse.json(
        { error: 'Account ID, name, conditions, and actions required' },
        { status: 400 }
      )
    }

    const rule = await prisma.emailrule.create({
      data: {
        accountId,
        name,
        enabled: enabled !== undefined ? enabled : true,
        priority: priority || 0,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
      },
    })

    console.log('[RULE_CREATED]', rule.name)

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error: any) {
    console.error('[RULE_CREATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to create rule', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update rule
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ruleId, name, enabled, priority, conditions, actions } = body

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    const rule = await prisma.emailrule.update({
      where: { id: ruleId },
      data: {
        name: name || undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        priority: priority !== undefined ? priority : undefined,
        conditions: conditions ? JSON.stringify(conditions) : undefined,
        actions: actions ? JSON.stringify(actions) : undefined,
      },
    })

    console.log('[RULE_UPDATED]', rule.name)

    return NextResponse.json({
      success: true,
      rule,
    })
  } catch (error: any) {
    console.error('[RULE_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update rule', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete rule
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    await prisma.emailrule.delete({
      where: { id: ruleId },
    })

    console.log('[RULE_DELETED]', ruleId)

    return NextResponse.json({
      success: true,
      message: 'Rule deleted',
    })
  } catch (error: any) {
    console.error('[RULE_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete rule', details: error.message },
      { status: 500 }
    )
  }
}
