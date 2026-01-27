
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { pageId, testId, variantId, eventType } = body;

        if (!pageId || !testId || !variantId || !['impression', 'click', 'conversion'].includes(eventType)) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        const metricsKey = `${eventType}s`; // impressions, clicks, conversions

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const [rows]: any = await connection.execute(
                'SELECT ab_tests FROM landing_pages WHERE id = ? FOR UPDATE',
                [pageId]
            );

            if (rows.length === 0 || !rows[0].ab_tests) {
                await connection.rollback();
                return NextResponse.json({ error: 'Page or test not found' }, { status: 404 });
            }

            let abTests = typeof rows[0].ab_tests === 'string'
                ? JSON.parse(rows[0].ab_tests)
                : rows[0].ab_tests;

            if (!abTests.active_test || abTests.active_test.id !== testId) {
                await connection.rollback();
                return NextResponse.json({ error: 'Test not active' }, { status: 404 });
            }

            const variants = abTests.active_test.variants as any[];
            const variantIndex = variants.findIndex((v: any) => v.id === variantId);

            if (variantIndex === -1) {
                await connection.rollback();
                return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
            }

            // Init stats if missing
            if (!variants[variantIndex].stats) {
                variants[variantIndex].stats = { impressions: 0, clicks: 0, conversions: 0 };
            }

            // Increment
            variants[variantIndex].stats[metricsKey] = (variants[variantIndex].stats[metricsKey] || 0) + 1;

            await connection.execute(
                'UPDATE landing_pages SET ab_tests = ? WHERE id = ?',
                [JSON.stringify(abTests), pageId]
            );

            await connection.commit();
            return NextResponse.json({ success: true });

        } catch (err) {
            await connection.rollback();
            console.error('Tracking error:', err);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        } finally {
            connection.release();
        }

    } catch (error) {
        return NextResponse.json({ error: 'Bad request' }, { status: 400 });
    }
}
