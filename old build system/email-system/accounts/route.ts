import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/crypto'

export const dynamic = 'force-dynamic'

function verifyAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  return authHeader.replace('Bearer ', '').startsWith('YWRtaW4')
}

// GET - List all accounts
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const accounts = await prisma.emailaccount.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({ accounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new account
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
    } = body

    // Validate required fields
    if (!name || !email || !username || !password || !imapHost || !smtpHost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Encrypt password
    const encryptedPassword = encrypt(password)

    // Create account
    const account = await prisma.emailaccount.create({
      data: {
        name,
        email,
        username,
        password: encryptedPassword,
        provider: 'custom',
        imapHost,
        imapPort: imapPort || 993,
        imapSecure: imapSecure !== false,
        smtpHost,
        smtpPort: smtpPort || 465,
        smtpSecure: smtpSecure !== false,
        isActive: true,
      },
    })

    console.log('[ACCOUNT_CREATED]', account.email)

    return NextResponse.json({ 
      success: true, 
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
      }
    })
  } catch (error: any) {
    console.error('[ACCOUNT_CREATE_ERROR]', error.message)
    return NextResponse.json({ 
      error: 'Failed to create account', 
      details: error.message 
    }, { status: 500 })
  }
}
