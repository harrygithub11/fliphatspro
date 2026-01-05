import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { sendFacebookEvent } from '@/lib/facebook';
import { headers } from 'next/headers';

export async function GET() {
    try {
        const connection = await pool.getConnection();

        // Fetch all customers from Strategy Calls / Bookings source
        const [rows]: any = await connection.execute(`
            SELECT 
                c.id, c.name, c.email, c.phone, c.created_at as submittedAt,
                o.status, o.amount, o.source,
                (SELECT content FROM interactions WHERE customer_id = c.id ORDER BY created_at DESC LIMIT 1) as last_interaction
            FROM customers c
            LEFT JOIN orders o ON c.id = o.customer_id
            ORDER BY c.created_at DESC
        `);

        connection.release();

        // Map to booking format for backward compatibility
        const bookings = rows.map((row: any) => ({
            id: row.id.toString(),
            name: row.name,
            email: row.email,
            phone: row.phone || '',
            store: row.store,
            submittedAt: row.submittedAt,
            status: row.stage || 'new'
        }));

        return NextResponse.json(bookings);
    } catch (error) {
        console.error('Failed to fetch bookings:', error);
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const headersList = headers();
        const ip = headersList.get('x-forwarded-for') || '0.0.0.0';
        const userAgent = headersList.get('user-agent') || '';

        const body = await request.json();
        const { name, email, phone, store, source } = body;

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
        }

        const connection = await pool.getConnection();

        try {
            // Check for existing customer by email
            const [existingRows]: any = await connection.execute(
                'SELECT id FROM customers WHERE email = ?',
                [email]
            );

            let customerId;

            if (existingRows.length > 0) {
                // Update existing customer
                customerId = existingRows[0].id;
                await connection.execute(
                    `UPDATE customers SET name = ?, phone = ?, notes = CONCAT(COALESCE(notes, ''), ?), updated_at = NOW() WHERE id = ?`,
                    [name, phone || '', `\nUpdated via Booking Form (${source}): ${store || ''}`, customerId]
                );
            } else {
                // Insert new customer
                const [result]: any = await connection.execute(
                    `INSERT INTO customers (name, email, phone, source, stage, score, tags, notes, created_at) 
                     VALUES (?, ?, ?, 'Strategy Call', 'new', 'warm', ?, ?, NOW())`,
                    [name, email, phone || '', JSON.stringify(['booking_form']), store || '']
                );
                customerId = result.insertId;
            }

            // Log interaction
            await connection.execute(
                `INSERT INTO interactions (type, customer_id, content, created_at) 
                 VALUES ('system_event', ?, ?, NOW())`,
                [customerId, JSON.stringify({ source: 'booking_form', action: 'form_submitted', ...body })]
            );

            connection.release();

            // Auto-create Deal/Order if coming from specific LPs
            let dealId = null;
            if (source === 'lifetime_12k' || source === 'newyear_5k') {
                const dealAmount = source === 'lifetime_12k' ? 12000 : 5000;
                const connection2 = await pool.getConnection(); // Re-acquire for second op if needed, or better keep previous open
                try {
                    const [dealRes]: any = await connection2.execute(
                        'INSERT INTO orders (customer_id, amount, status, source, razorpay_order_id, proposal_status) VALUES (?, ?, ?, ?, ?, ?)',
                        [customerId, dealAmount, 'initiated', source, `DEAL_${Date.now()}`, 'draft']
                    );
                    dealId = dealRes.insertId;

                    // Log deal creation interaction
                    await connection2.execute(
                        `INSERT INTO interactions (type, customer_id, content, created_at) 
                         VALUES ('system_event', ?, ?, NOW())`,
                        [customerId, JSON.stringify({ source: 'system', action: 'auto_deal_created', amount: dealAmount })]
                    );

                    // Fire Facebook Purchase Event
                    try {
                        await sendFacebookEvent('Purchase', {
                            email,
                            phone,
                            firstName: name,
                            ip,
                            userAgent
                        }, {
                            currency: 'INR',
                            value: dealAmount
                        });
                    } catch (fbError) {
                        console.error('FB Event Error:', fbError);
                    }
                } catch (err) {
                    console.error("Failed to auto-create deal:", err);
                } finally {
                    connection2.release();
                }
            }

            return NextResponse.json({
                success: true,
                booking: {
                    id: customerId.toString(),
                    name,
                    email,
                    phone,
                    store,
                    submittedAt: new Date().toISOString(),
                    status: 'new',
                    dealId
                }
            });
        } catch (dbError) {
            connection.release();
            throw dbError;
        }
    } catch (error: any) {
        console.error('Failed to save booking:', error);
        return NextResponse.json({
            success: false,
            error: error.code === 'ER_DUP_ENTRY' ? 'Email already exists' : 'Failed to save booking'
        }, { status: 500 });
    }
}
