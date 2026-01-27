import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requirePlatformAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET global settings
export async function GET(request: Request) {
    try {
        await requirePlatformAdmin(); // Protect route

        const connection = await pool.getConnection();
        try {
            const [rows]: any = await connection.execute('SELECT * FROM platform_settings');

            // Convert to object
            const settings: Record<string, string> = {};
            rows.forEach((row: any) => {
                settings[row.setting_key] = row.setting_value;
            });

            return NextResponse.json(settings);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// UPDATE global settings
export async function POST(request: Request) {
    try {
        await requirePlatformAdmin();

        const body = await request.json();
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            for (const [key, value] of Object.entries(body)) {
                await connection.execute(
                    'INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
                    [key, String(value)]
                );
            }

            await connection.commit();
            return NextResponse.json({ success: true });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
