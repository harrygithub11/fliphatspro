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
            // Format Notes - CLEANER now, only key info not in other fields
            const serviceTags = Array.isArray(services) ? services.join(', ') : services;
            // Only put things in notes that don't have their own columns if needed, or keep it clean
            // For now, we can keep a summarized note or just empty if we want admin to write notes.
            // But let's keep a system note for "inquiry received" context if needed, 
            // OR just rely on the columns. The user wanted to "separate" them.
            // Let's make notes purely for admin usage and maybe just a header "Web Inquiry".

            // Actually, if we want to preserve the "full email text" feel in notes, we can keep it,
            // BUT we MUST ALSO populate the specific columns.
            // The user request was "separate detailed project info ... from the notes field".
            // So we should NOT put them in notes anymore to avoid duplication/clutter.

            // However, we need to handle the case where we might overwrite existing user notes.
            // The API appends. 

            // Let's set a simple notification in notes if anything
            const inquiryNote = `Inquiry from Website - See Project Tab for details.`;

            // Budget is now a string to support ranges (e.g. "$1k - $5k")
            const budgetVal = budget || null;
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
                     SET company = ?,
                         project_desc = ?,
                         budget = ?,
                         tags = ?,
                         updated_at = NOW(),
                         score = 'warm',
                         stage = IF(stage = 'new', 'contacted', stage) 
                     WHERE id = ?`,
                    [company || '', description || '', budgetVal, tagsVal, leadId]
                );
                // We deliberately DO NOT append to notes here to keep it clean, 
                // unless we want to log the "event" which we do in interactions table.
            } else {
                // 3. Create new customer
                const [result]: any = await connection.execute(
                    `INSERT INTO customers 
                    (name, email, phone, source, notes, company, project_desc, stage, score, budget, tags, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                    [
                        name,
                        email,
                        phone || '',
                        'Website',
                        inquiryNote, // Simple note
                        company || '',
                        description || '',
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
                        `New Website Inquiry. Services: ${serviceTags}`
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
