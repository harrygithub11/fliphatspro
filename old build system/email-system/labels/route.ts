/**
 * Email Labels API
 * Create and manage labels/tags for email organization
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all labels for account
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

    const labels = await prisma.emaillabel.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      labels,
      count: labels.length,
    })
  } catch (error: any) {
    console.error('[LABELS_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get labels', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create new label
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { accountId, name, color, icon } = body

    if (!accountId || !name) {
      return NextResponse.json(
        { error: 'Account ID and name required' },
        { status: 400 }
      )
    }

    // Check if label already exists
    const existing = await prisma.emaillabel.findUnique({
      where: {
        accountId_name: {
          accountId,
          name,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Label with this name already exists' },
        { status: 400 }
      )
    }

    const label = await prisma.emaillabel.create({
      data: {
        accountId,
        name,
        color: color || '#3B82F6',
        icon: icon || null,
      },
    })

    console.log('[LABEL_CREATED]', label.name)

    return NextResponse.json({
      success: true,
      label,
    })
  } catch (error: any) {
    console.error('[LABEL_CREATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to create label', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update label
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { labelId, name, color, icon } = body

    if (!labelId) {
      return NextResponse.json({ error: 'Label ID required' }, { status: 400 })
    }

    const label = await prisma.emaillabel.update({
      where: { id: labelId },
      data: {
        name: name || undefined,
        color: color || undefined,
        icon: icon !== undefined ? icon : undefined,
      },
    })

    console.log('[LABEL_UPDATED]', label.name)

    return NextResponse.json({
      success: true,
      label,
    })
  } catch (error: any) {
    console.error('[LABEL_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update label', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete label
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const labelId = searchParams.get('labelId')

    if (!labelId) {
      return NextResponse.json({ error: 'Label ID required' }, { status: 400 })
    }

    // Delete all labelings first
    await prisma.emaillabeling.deleteMany({
      where: { labelId },
    })

    // Delete label
    await prisma.emaillabel.delete({
      where: { id: labelId },
    })

    console.log('[LABEL_DELETED]', labelId)

    return NextResponse.json({
      success: true,
      message: 'Label deleted',
    })
  } catch (error: any) {
    console.error('[LABEL_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete label', details: error.message },
      { status: 500 }
    )
  }
}
