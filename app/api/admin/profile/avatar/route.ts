
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get('current_file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Validate file type (basic check)
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ success: false, message: 'Invalid file type' }, { status: 400 });
        }

        // Generate unique filename
        const filename = `avatar_${session.id}_${Date.now()}_${file.name.replace(/\s/g, '_')}`;
        const path = join(process.cwd(), 'public/uploads', filename);

        // Ensure directory exists
        await mkdir(dirname(path), { recursive: true });

        // Save file locally (In production, use S3/Cloudinary)
        await writeFile(path, buffer);
        const fileUrl = `/uploads/${filename}`;

        // Update Database
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'UPDATE admins SET avatar_url = ? WHERE id = ?',
                [fileUrl, session.id]
            );

            // Log activity
            await connection.execute(
                `INSERT INTO admin_activity_log (admin_id, action_type, action_description, ip_address) 
                 VALUES (?, 'update_avatar', 'Uploaded new profile picture', ?)`,
                [session.id, req.headers.get('x-forwarded-for') || 'unknown']
            );

        } finally {
            connection.release();
        }

        return NextResponse.json({ success: true, url: `${fileUrl}?t=${Date.now()}` });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
