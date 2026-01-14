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

            const budgetVal = parseFloat(budget?.replace(/[^0-9.]/g, '') || '0');
            const tagsVal = JSON.stringify(services);

            // 1. Check if customer exists
            const [rows]: any = await connection.execute(
                'SELECT id FROM customers WHERE email = ?',
                [email]
            );

            let leadId = null;

            if (rows.length > 0) {
                // 2. Update existing customer
                leadId = rows[0].id;
                await connection.execute(
                    `UPDATE customers 
                     SET notes = CONCAT(COALESCE(notes, ''), '\n\n-- New Inquiry --\n', ?),
                         updated_at = NOW(),
                         score = 'warm',
                         stage = IF(stage = 'new', 'contacted', stage) 
                     WHERE id = ?`,
                    [fullNote, leadId]
                );
            } else {
                // 3. Create new customer
                const [result]: any = await connection.execute(
                    `INSERT INTO customers 
                    (name, email, phone, source, notes, stage, score, budget, tags, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        name,
                        email,
                        phone || '',
                        'Website',
                        fullNote,
                        'new',
                        'warm',
                        budgetVal,
                        tagsVal
                    ]
                );
                leadId = result.insertId;
            }

            // 4. Log Interaction
            if (leadId) {
                await connection.execute(
                    'INSERT INTO interactions (customer_id, type, content, created_at) VALUES (?, ?, ?, NOW())',
                    [
                        leadId,
                        'system_event',
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
            { success: false, message: 'Internal Server Error', error: error.message || String(error) },
            { status: 500 }
        );
    }
}
