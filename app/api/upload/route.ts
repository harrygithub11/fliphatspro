import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, isAbsolute } from 'path';
import { existsSync } from 'fs';
import { requireTenantAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        // Enforce Authentication
        const { tenantId, session } = await requireTenantAuth(request);

        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Usage:
        // Local: UPLOAD_DIR=./public/uploads (default fallback)
        // Prod:  UPLOAD_DIR=/home/fliphatmedia-ecom/storage/uploads
        let uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public/uploads');

        // Ensure absolute path if not provided (for safety)
        if (!isAbsolute(uploadDir) && process.env.UPLOAD_DIR) {
            uploadDir = join(process.cwd(), uploadDir);
        }

        // Ideally, we should separate uploads by tenant
        // e.g. uploadDir = join(uploadDir, tenantId);
        // But to avoid breaking existing file paths immediately, we'll keep shared folder 
        // BUT obfuscate filename more securely or track it in DB.

        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate unique filename with tenant prefix to prevent collisions/guessing
        const filename = `${tenantId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // URL Protocol:
        // We assume Nginx maps /uploads/ -> UPLOAD_DIR
        const url = `/uploads/${filename}`;

        // Determine simple type
        let type = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        return NextResponse.json({
            success: true,
            url,
            type,
            filename
        });

    } catch (error: any) {
        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
