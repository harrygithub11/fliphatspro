
import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const [leads]: any = await pool.execute(
            `SELECT id, leadEmail, status, currentStep, nextStepDue FROM campaign_lead WHERE campaignId = ?`,
            [params.id]
        )
        return NextResponse.json({ leads, count: leads.length, serverTime: new Date() })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
