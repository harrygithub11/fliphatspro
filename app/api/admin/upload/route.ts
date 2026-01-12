import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
