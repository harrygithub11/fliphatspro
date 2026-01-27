import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { DynamicPageContent } from '@/components/landing/DynamicPageContent';

export const dynamic = 'force-dynamic';

// Helper to fetch page data
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

// Generate Metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getPageData(slug);

    if (!page) return { title: 'Page Not Found' };

    const content = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
    const seo = content.seo || {};

    return {
        title: seo.title || page.name,
        description: seo.description,
        openGraph: {
            images: seo.og_image ? [seo.og_image] : [],
        },
    };
}

export default async function DynamicSalePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const page = await getPageData(slug);

    if (!page) {
        notFound();
    }

    const content = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
    const abTests = page.ab_tests ? (typeof page.ab_tests === 'string' ? JSON.parse(page.ab_tests) : page.ab_tests) : null;

    return <DynamicPageContent content={content} slug={slug} pageId={page.id} abTests={abTests} />;
}
