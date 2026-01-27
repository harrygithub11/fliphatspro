import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { DynamicPageContent } from '@/components/landing/DynamicPageContent';

export const dynamic = 'force-dynamic';

async function getPageData(slug: string) {
    const connection = await pool.getConnection();
    try {
        const [rows]: any = await connection.execute(
            'SELECT * FROM landing_pages WHERE slug = ? AND is_active = 1',
            [slug]
        );
        return rows.length > 0 ? rows[0] : null;
    } finally {
        connection.release();
    }
}

export default async function LifetimeOfferPage() {
    const slug = 'lifetimeoffer';
    const page = await getPageData(slug);

    if (!page) {
        notFound();
    }

    const content = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;

    return <DynamicPageContent content={content} slug={slug} />;
}
