import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createSession } from '@/lib/auth';
import { createTenant } from '@/lib/tenant-context';
import { seedTenantData } from '@/lib/tenant-lifecycle';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password, companyName } = body;

        // 1. Basic Validation
        if (!name || !email || !password || !companyName) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // 2. Check Platform Settings
            const [settings]: any = await connection.execute(
                "SELECT setting_value FROM platform_settings WHERE setting_key = 'allow_registration'"
            );

            // Default to true if setting missing, or check value
            if (settings.length > 0 && settings[0].setting_value === 'false') {
                return NextResponse.json({ error: 'Registration is currently disabled' }, { status: 403 });
            }

            // 3. Check if user already exists
            const [existingUsers]: any = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
            }

            // 4. Generate Slug
            const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const slug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`;

            // 5. Create User
            const hashedPassword = await bcrypt.hash(password, 10);
            const [userResult]: any = await connection.execute(
                'INSERT INTO users (name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
                [name, email, hashedPassword]
            );
            const userId = userResult.insertId;

            try {
                // 6. Create Tenant (uses helper with RBAC seeding)
                const tenant = await createTenant(companyName, slug, userId, 'free');
                const tenantId = tenant.id;

                // 7. Seed Default Data (Templates, etc.)
                await seedTenantData(tenantId);

                // 8. Create Session
                await createSession({
                    id: userId,
                    email: email,
                    name: name,
                    role: 'owner', // Context role
                });

                return NextResponse.json({ success: true, tenantId });

            } catch (err) {
                // If tenant creation fails, clean up user
                await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
                throw err;
            }

        } finally {
            connection.release();
        }
    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
    }
}
