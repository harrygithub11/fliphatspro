import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const session = await getSession();

        if (!session || !session.email) {
            return NextResponse.json({ success: false }, { status: 401 });
        }

        // Update current user
        await prisma.admin.update({
            where: { email: session.email },
            data: {
                isOnline: true,
                lastSeen: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Heartbeat error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
