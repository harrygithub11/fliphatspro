import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import crypto from 'crypto';

export async function GET() {
    try {
        const session = await getSession();

        const connection = await pool.getConnection();
        try {
            // Fetch all settings as key-value pairs
            const [rows]: any = await connection.execute('SELECT `key`, `value` FROM system_settings');

            // Convert to object
            const settings: any = {
                site_name: 'FliphatMedia',
                razorpay_key_id: '',
                razorpay_key_secret: '',
                facebook_pixel_id: '',
                google_analytics_id: '',
                offer_end_date: '',
                newyear_offer_date: '',
                facebook_page_id: '',
                facebook_access_token: '',
                facebook_app_secret: '',
                webhook_verify_token: ''
            };

            rows.forEach((row: any) => {
                settings[row.key] = row.value;
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

export async function POST(request: Request) {
    try {
        const session = await getSession();

        const body = await request.json();

        const connection = await pool.getConnection();
        try {
            // Check if this is a single key-value update (from GeneralSettings) or bulk update
            if (body.key && body.value !== undefined) {
                // Single setting update (offer dates)
                const { key, value, description } = body;

                const [existing]: any = await connection.execute(
                    'SELECT id FROM system_settings WHERE `key` = ?',
                    [key]
                );

                if (existing.length === 0) {
                    await connection.execute(
                        'INSERT INTO system_settings (id, `key`, `value`, description) VALUES (?, ?, ?, ?)',
                        [crypto.randomUUID(), key, value, description || '']
                    );
                } else {
                    await connection.execute(
                        'UPDATE system_settings SET `value` = ?, description = ? WHERE `key` = ?',
                        [value, description || '', key]
                    );
                }
            } else {
                // Bulk update (API & Integration settings)
                console.log('Bulk updating settings:', body);

                const settingsToUpdate = [
                    { key: 'site_name', value: body.site_name },
                    { key: 'razorpay_key_id', value: body.razorpay_key_id },
                    { key: 'razorpay_key_secret', value: body.razorpay_key_secret },
                    { key: 'facebook_pixel_id', value: body.facebook_pixel_id },
                    { key: 'google_analytics_id', value: body.google_analytics_id },
                    { key: 'facebook_page_id', value: body.facebook_page_id },
                    { key: 'facebook_access_token', value: body.facebook_access_token },
                    { key: 'facebook_app_secret', value: body.facebook_app_secret },
                    { key: 'webhook_verify_token', value: body.webhook_verify_token }
                ];

                for (const setting of settingsToUpdate) {
                    const safeValue = setting.value ?? '';
                    console.log(`Processing ${setting.key}:`, safeValue ? 'Has Value' : 'Empty');

                    const [existing]: any = await connection.execute(
                        'SELECT id FROM system_settings WHERE `key` = ?',
                        [setting.key]
                    );

                    try {
                        if (existing.length === 0) {
                            await connection.execute(
                                'INSERT INTO system_settings (id, `key`, `value`) VALUES (?, ?, ?)',
                                [crypto.randomUUID(), setting.key, safeValue]
                            );
                        } else {
                            await connection.execute(
                                'UPDATE system_settings SET `value` = ? WHERE `key` = ?',
                                [safeValue, setting.key]
                            );
                        }
                    } catch (dbError) {
                        console.error(`DB Error for ${setting.key}:`, dbError);
                    }
                }
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
