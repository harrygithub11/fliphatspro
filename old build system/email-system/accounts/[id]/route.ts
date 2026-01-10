/**
 * Email Account Update API
 * Handles updating individual email account settings including signature
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// PATCH - Update account (including signature)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params
    const body = await request.json()
    const { signature, signatureHtml, useSignature } = body

    // Update only signature fields
    const account = await prisma.emailaccount.update({
      where: { id },
      data: {
        signature: signature !== undefined ? signature : undefined,
        signatureHtml: signatureHtml !== undefined ? signatureHtml : undefined,
        useSignature: useSignature !== undefined ? useSignature : undefined,
      },
    })

    console.log('[ACCOUNT_UPDATED]', account.email, '- Signature updated')

    return NextResponse.json({
      success: true,
      message: 'Account updated successfully',
      account: {
        id: account.id,
        signature: account.signature,
        signatureHtml: account.signatureHtml,
        useSignature: account.useSignature,
      },
    })
  } catch (error: any) {
    console.error('[ACCOUNT_UPDATE_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to update account', details: error.message },
      { status: 500 }
    )
  }
}

// GET - Get account details (including signature)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    const account = await prisma.emailaccount.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        signature: true,
        signatureHtml: true,
        useSignature: true,
      },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      account,
    })
  } catch (error: any) {
    console.error('[ACCOUNT_GET_ERROR]', error.message)
    return NextResponse.json(
      { error: 'Failed to get account', details: error.message },
      { status: 500 }
    )
  }
}
