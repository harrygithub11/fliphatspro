import pool from '@/lib/db';
import PageEditor from '../components/PageEditor';

export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Fetch page data server-side
    const connection = await pool.getConnection();
    let page = null;

    try {
        const [rows]: any = await connection.execute(
            'SELECT * FROM landing_pages WHERE id = ?',
            [id]
        );
        if (rows.length > 0) {
            page = rows[0];
            // Ensure content is parsed if string
            if (typeof page.content === 'string') {
                page.content = JSON.parse(page.content);
            }
        }
    } finally {
        connection.release();
    }

    if (!page) {
        notFound();
    }

    return <PageEditor initialData={page} isEditing={true} />;
}
