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
                    notes = CONCAT(COALESCE(notes, ''), '\n\n-- New Inquiry --\n', VALUES(notes)),
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

            let leadId = result.insertId;

            // If updated (duplicate), insertId might be 0. Fetch the ID.
            if (!leadId) {
                const [rows]: any = await connection.execute('SELECT id FROM customers WHERE email = ?', [email]);
                if (rows.length > 0) {
                    leadId = rows[0].id;
                }
            }

            if (leadId) {
                // Log Interaction
                await connection.execute(
                    'INSERT INTO interactions (customer_id, type, content, created_at) VALUES (?, ?, ?, NOW())',
                    [
                        leadId,
                        'lead_created',
                        `New Website Inquiry from ${name}. Services: ${serviceTags}`
                    ]
                );
            }

            return NextResponse.json({ success: true, message: 'Inquiry received' });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error("Contact API Error:", error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
