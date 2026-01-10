/**
 * Contacts API
 * Manage email contacts with details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all contacts for account
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites') === 'true'

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 })
    }

    const where: any = { accountId }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (favorites) {
      where.isFavorite = true
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { emailCount: 'desc' }, { name: 'asc' }],
      take: 100, // Limit results
    })

    return NextResponse.json({
      success: true,
      contacts,
      count: contacts.length,
    })
  } catch (error: any) {
    console.error('[CONTACTS_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get contacts', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update contact
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      accountId,
      email,
      name,
      firstName,
      lastName,
      company,
      phone,
      notes,
      avatar,
      tags,
      isFavorite,
    } = body

    if (!accountId || !email) {
      return NextResponse.json(
        { error: 'Account ID and email required' },
        { status: 400 }
      )
    }

    // Upsert contact (create or update)
    const contact = await prisma.contact.upsert({
      where: {
        accountId_email: {
          accountId,
          email,
        },
      },
      update: {
        name: name || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        company: company || undefined,
        phone: phone || undefined,
        notes: notes !== undefined ? notes : undefined,
        avatar: avatar || undefined,
        tags: tags || undefined,
        isFavorite: isFavorite !== undefined ? isFavorite : undefined,
        updatedAt: new Date(),
      },
      create: {
        accountId,
        email,
        name: name || null,
        firstName: firstName || null,
        lastName: lastName || null,
        company: company || null,
        phone: phone || null,
        notes: notes || null,
        avatar: avatar || null,
        tags: tags || null,
        isFavorite: isFavorite || false,
      },
    })

    console.log('[CONTACT_SAVED]', contact.email)

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('[CONTACT_SAVE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to save contact', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update contact stats (email count, last email date)
export async function PATCH(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { contactId, emailCount, lastEmailDate } = body

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        emailCount: emailCount !== undefined ? emailCount : undefined,
        lastEmailDate: lastEmailDate !== undefined ? new Date(lastEmailDate) : undefined,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      contact,
    })
  } catch (error: any) {
    console.error('[CONTACT_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update contact', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete contact
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
      return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })
    }

    await prisma.contact.delete({
      where: { id: contactId },
    })

    console.log('[CONTACT_DELETED]', contactId)

    return NextResponse.json({
      success: true,
      message: 'Contact deleted',
    })
  } catch (error: any) {
    console.error('[CONTACT_DELETE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error.message },
      { status: 500 }
    )
  }
}
