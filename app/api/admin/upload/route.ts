import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { requireTenantRole } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        // Use consistent tenant-aware auth (Admin role required)
        const { session, tenantId } = await requireTenantRole('admin', request);

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Sanitize filename and add timestamp
        const sanitizedParams = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
        const filename = `${Date.now()}-${sanitizedParams}`;

        // Path Determination
        // Local: public/uploads
        // Prod: [UPLOAD_DIR]
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'public', 'uploads');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore error if directory already exists
        }

        // Write file
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return public URL (Served via Nginx alias in prod)
        const url = `/uploads/${filename}`;
        return NextResponse.json({ url });

    } catch (error: any) {
        console.error('Upload Error:', error);

        // Handle auth errors gracefully
        if (error.message && (error.message.includes('Unauthorized') || error.message.includes('high'))) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
