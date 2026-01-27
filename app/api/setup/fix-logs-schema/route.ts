
import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function GET() {
    try {
        const connection = await pool.getConnection()
        try {
            console.log('Altering campaign_logs table...')
            await connection.execute(`ALTER TABLE campaign_logs MODIFY lead_id VARCHAR(191) NULL`)
            console.log('Success')
        } finally {
            connection.release()
        }
        return NextResponse.json({ success: true, message: 'Schema fixed' })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
