import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            email,
            phone,
            company,
            services = [],
            budget,
            description
        } = body;

        // Basic Validation
        if (!name || !email) {
            return NextResponse.json(
                { success: false, message: 'Name and Email are required' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();
        try {
            // Check if customer exists by email to avoid duplicates (optional, but good practice)
            // For now, we'll let the UNIQUE constraint on email handle it or insert ignore/update
            // But Prisma/SQL allows handling this. We'll try to Insert, if fails, we might update or just error.
            // Simplified: Just Insert.

            // Format Notes
            const serviceTags = Array.isArray(services) ? services.join(', ') : services;
            const fullNote = `
                **Web Inquiry**
                **Company:** ${company || 'N/A'}
                **Budget:** ${budget || 'N/A'}
                **Services:** ${serviceTags}
                
                **Message:**
                ${description || 'No description provided'}
            `.trim();

            const [result]: any = await connection.execute(
                `INSERT INTO customers 
                (name, email, phone, source, notes, stage, score, budget, tags, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE 
                    notes = CONCAT(notes, '\n\n-- New Inquiry --\n', VALUES(notes)),
                    updated_at = NOW()`,
                [
                    name,
                    email,
                    phone || '',
                    'Website',
                    fullNote,
                    'new',
                    'warm', // Serious inquiry
                    parseFloat(budget?.replace(/[^0-9.]/g, '') || '0'), // Attempt to parse clean number
                    JSON.stringify(services) // Store tags as JSON
                ]
            );

            const leadId = result.insertId || result.insertId; // If update, insertId might be 0 or same. 
            // Note: mysql2/mysql insertId behavior on update varies, reliable way is select if 0.

            // Log Interaction
            await connection.execute(
                'INSERT INTO interactions (customer_id, type, content, created_at) VALUES (?, ?, ?, NOW())',
                [
                    leadId,
                    'lead_created',
                    `New Website Inquiry from ${name}. Services: ${serviceTags}`
                ]
            );

            return NextResponse.json({ success: true, message: 'Inquiry received' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Contact API Error:", error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
