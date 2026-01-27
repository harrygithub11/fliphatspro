
import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth';
import { updateTenantStatus, deleteTenant } from '@/lib/tenant-lifecycle';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await requirePlatformAdmin();
        const tenantId = params.id;

        await deleteTenant(tenantId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await requirePlatformAdmin();
        const tenantId = params.id;
        const body = await request.json();
        const { status } = body;

        if (!status || !['active', 'suspended', 'archived'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        await updateTenantStatus(tenantId, status);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
