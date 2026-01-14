
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, leadIds, data } = body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return NextResponse.json({ success: false, message: 'No leads selected' }, { status: 400 });
        }

        if (action === 'delete') {
            await prisma.customer.deleteMany({
                where: {
                    id: { in: leadIds }
                }
            });
            return NextResponse.json({ success: true, message: `Deleted ${leadIds.length} leads` });
        }

        if (action === 'add_tags') {
            const tagToAdd = data.tag;
            if (!tagToAdd) return NextResponse.json({ success: false, message: 'Tag is required' }, { status: 400 });

            // We need to fetch existing tags, append new one, and save back
            // This is transactionally safer if done one by one or via a raw query if JSON
            // For simplicity/prisma limitation on JSON array append, we'll loop or use raw query if applicable.
            // But Prisma doesn't easily support JSON array append without fetching.
            // Let's do a fetch-update loop for now, or just setting if it's simpler. 
            // Better approach for bulk: 
            // 1. Fetch all selected leads
            // 2. Compute new tags for each
            // 3. Update.

            const leads = await prisma.customer.findMany({
                where: { id: { in: leadIds } },
                select: { id: true, tags: true }
            });

            const updates = leads.map(lead => {
                let currentTags: string[] = [];
                try {
                    if (typeof lead.tags === 'string') {
                        currentTags = JSON.parse(lead.tags);
                    } else if (Array.isArray(lead.tags)) {
                        currentTags = lead.tags as string[];
                    }
                } catch (e) { }

                if (!Array.isArray(currentTags)) currentTags = [];

                if (!currentTags.includes(tagToAdd)) {
                    currentTags.push(tagToAdd);
                }

                return prisma.customer.update({
                    where: { id: lead.id },
                    data: { tags: JSON.stringify(currentTags) }
                });
            });

            await prisma.$transaction(updates);
            return NextResponse.json({ success: true, message: `Added tag "${tagToAdd}" to ${leadIds.length} leads` });
        }

        if (action === 'update_status') {
            await prisma.customer.updateMany({
                where: { id: { in: leadIds } },
                data: { stage: data.stage }
            });
            return NextResponse.json({ success: true, message: `Updated status for ${leadIds.length} leads` });
        }

        if (action === 'assign_owner') {
            await prisma.customer.updateMany({
                where: { id: { in: leadIds } },
                data: { owner: data.owner }
            });
            return NextResponse.json({ success: true, message: `Assigned ${leadIds.length} leads to ${data.owner}` });
        }

        if (action === 'update_score') {
            await prisma.customer.updateMany({
                where: { id: { in: leadIds } },
                data: { score: data.score }
            });
            return NextResponse.json({ success: true, message: `Updated score for ${leadIds.length} leads` });
        }

        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Bulk action error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
