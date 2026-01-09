import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import pool from '@/lib/db';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

// Helper to detect column names using fuzzy matching
function detectColumn(headers: string[], patterns: string[]): string | null {
    const normalized = headers.map(h => h.toLowerCase().trim());

    for (const pattern of patterns) {
        const index = normalized.findIndex(h =>
            h.includes(pattern) || pattern.includes(h)
        );
        if (index !== -1) return headers[index];
    }
    return null;
}

// Validate email format
function isValidEmail(email: string): boolean {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Clean phone number
function cleanPhone(phone: string): string {
    if (!phone) return '';
    return phone.replace(/[^\d+]/g, '');
}

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        // Read file content
        const text = await file.text();

        // Parse CSV
        const parseResult = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header: string) => header.trim(),
        });

        if (parseResult.errors.length > 0) {
            return NextResponse.json({
                success: false,
                message: 'Invalid CSV format',
                errors: parseResult.errors
            }, { status: 400 });
        }

        const rows = parseResult.data as Record<string, any>[];
        const headers = parseResult.meta.fields || [];

        if (headers.length === 0) {
            return NextResponse.json({ success: false, message: 'CSV has no columns' }, { status: 400 });
        }

        // Auto-detect columns
        const namePatterns = ['name', 'full name', 'customer name', 'first name', 'contact name', 'client name'];
        const phonePatterns = ['phone', 'mobile', 'cell', 'telephone', 'contact number', 'phone number', 'number'];
        const emailPatterns = ['email', 'e-mail', 'email address', 'contact email', 'mail'];

        const nameCol = detectColumn(headers, namePatterns);
        const phoneCol = detectColumn(headers, phonePatterns);
        const emailCol = detectColumn(headers, emailPatterns);

        if (!nameCol && !emailCol) {
            return NextResponse.json({
                success: false,
                message: 'Could not detect name or email columns. CSV must have at least name or email column.',
                detectedColumns: { name: nameCol, phone: phoneCol, email: emailCol }
            }, { status: 400 });
        }

        // Process rows
        const connection = await pool.getConnection();
        const results = {
            total: rows.length,
            imported: 0,
            skipped: 0,
            failed: 0,
            errors: [] as string[]
        };

        try {
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const name = nameCol ? String(row[nameCol] || '').trim() : '';
                const phone = phoneCol ? cleanPhone(String(row[phoneCol] || '')) : '';
                const email = emailCol ? String(row[emailCol] || '').trim() : '';

                // Skip if no name and no email
                if (!name && !email) {
                    results.skipped++;
                    continue;
                }

                // Validate email if provided
                if (email && !isValidEmail(email)) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: Invalid email format "${email}"`);
                    continue;
                }

                try {
                    // Check for duplicate email
                    if (email) {
                        const [existing]: any = await connection.execute(
                            'SELECT id FROM customers WHERE email = ?',
                            [email]
                        );

                        if (existing.length > 0) {
                            results.skipped++;
                            continue; // Skip duplicate
                        }
                    }

                    // Insert customer
                    await connection.execute(
                        `INSERT INTO customers (name, phone, email, source, stage, score, owner, created_at) 
                         VALUES (?, ?, ?, 'csv_import', 'new', 'cold', ?, NOW())`,
                        [name || 'Unknown', phone, email, session.id]
                    );

                    results.imported++;

                } catch (dbError: any) {
                    results.failed++;
                    results.errors.push(`Row ${i + 2}: ${dbError.message}`);
                }
            }

            // Log activity
            await connection.execute(
                `INSERT INTO admin_activity_log (admin_id, action_type, action_description, ip_address) 
                 VALUES (?, 'csv_import', ?, ?)`,
                [
                    session.id,
                    `Imported ${results.imported} leads from CSV`,
                    request.headers.get('x-forwarded-for') || 'unknown'
                ]
            );

        } finally {
            connection.release();
        }

        return NextResponse.json({
            success: true,
            message: `Successfully imported ${results.imported} leads`,
            detectedColumns: {
                name: nameCol,
                phone: phoneCol,
                email: emailCol
            },
            results
        });

    } catch (error) {
        console.error('CSV Import Error:', error);
        return NextResponse.json({
            success: false,
            message: 'Import failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
