
import { NextResponse } from 'next/server';
import { requireTenantRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { WORKSPACE_SETTINGS_SCHEMA } from '@/lib/settings-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Use 'admin' role check which internally gets tenant context
        const { tenantId } = await requireTenantRole('viewer', request);
        // Allow viewers to read settings? Or member? Let's say 'member' is fine for reading public-ish config?
        // Actually, configuration usually requires Admin. 'viewer' might need it for branding though.
        // Let's stick to safe defaults.

        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                settings_: true // TenantSetting[]
            }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Merge Core Fields and Dynamic Settings into one flat object
        const values: Record<string, any> = {
            name: tenant.name,
            slug: tenant.slug,
            domain: tenant.domain,
            logoUrl: tenant.logoUrl,
            plan: tenant.plan, // Read-only usually, but good to have
            status: tenant.status
        };

        // Add dynamic settings
        if (tenant.settings_) {
            tenant.settings_.forEach((s: any) => {
                values[s.settingKey] = s.settingValue;
            });
        }

        // Apply Defaults from Schema if value is missing
        WORKSPACE_SETTINGS_SCHEMA.forEach(section => {
            section.fields.forEach(field => {
                if (values[field.key] === undefined && field.defaultValue !== undefined) {
                    values[field.key] = field.defaultValue;
                }
            });
        });

        return NextResponse.json({
            config: WORKSPACE_SETTINGS_SCHEMA,
            values: values
        });

    } catch (error: any) {
        // Handle auth errors gracefully
        if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        console.error('Settings Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { tenantId } = await requireTenantRole('admin', request);

        const body = await request.json();
        const updates: Record<string, any> = {};
        const settingUpdates: Record<string, any> = {};

        // Iterate through schema to validate and route fields
        for (const section of WORKSPACE_SETTINGS_SCHEMA) {
            for (const field of section.fields) {
                if (body[field.key] !== undefined) {
                    if (field.storage === 'tenant') {
                        // Only allow updating certain core tenant fields
                        if (['name', 'slug', 'domain', 'logoUrl'].includes(field.key)) {
                            updates[field.key] = body[field.key];
                        }
                    } else if (field.storage === 'tenant_setting') {
                        settingUpdates[field.key] = body[field.key];
                    }
                }
            }
        }

        // Slug Validation
        if (updates.slug !== undefined) {
            const newSlug = String(updates.slug).toLowerCase().trim();

            // Format validation
            if (!/^[a-z0-9-]+$/.test(newSlug)) {
                return NextResponse.json({
                    error: 'Slug must contain only lowercase letters, numbers, and hyphens'
                }, { status: 400 });
            }

            if (newSlug.length < 3) {
                return NextResponse.json({
                    error: 'Slug must be at least 3 characters'
                }, { status: 400 });
            }

            // Uniqueness check (excluding current tenant)
            const existing = await prisma.tenant.findFirst({
                where: {
                    slug: newSlug,
                    id: { not: tenantId }
                }
            });

            if (existing) {
                return NextResponse.json({
                    error: 'This workspace URL is already taken'
                }, { status: 400 });
            }

            updates.slug = newSlug; // Ensure lowercase
        }

        // 1. Update Core Tenant Fields
        if (Object.keys(updates).length > 0) {
            await prisma.tenant.update({
                where: { id: tenantId },
                data: updates
            });
        }

        // 2. Upsert Dynamic Settings
        const updatePromises = Object.entries(settingUpdates).map(([key, value]) => {
            // Convert value to string for storage
            let stringValue = String(value);
            if (typeof value === 'boolean') stringValue = value ? 'true' : 'false';
            if (typeof value === 'object') stringValue = JSON.stringify(value);
            if (value === null || value === undefined) stringValue = '';

            return prisma.tenantSetting.upsert({
                where: {
                    tenantId_settingKey: {
                        tenantId: tenantId,
                        settingKey: key
                    }
                },
                update: { settingValue: stringValue },
                create: {
                    tenantId: tenantId,
                    settingKey: key,
                    settingValue: stringValue
                }
            });
        });

        if (updatePromises.length > 0) {
            await prisma.$transaction(updatePromises);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Settings Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
