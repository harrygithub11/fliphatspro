import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

// GET current logged-in admin info
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        return NextResponse.json({
            success: true,
            admin: {
                id: session.id,
                name: session.name,
                email: session.email,
                role: session.role
            }
        });

    } catch (error) {
        console.error("Get Current User Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
