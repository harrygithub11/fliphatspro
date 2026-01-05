import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const connection = await pool.getConnection();
        try {
            // customers table updates
            await connection.execute(`
                ALTER TABLE customers 
                ADD COLUMN source VARCHAR(50) DEFAULT 'Website',
                ADD COLUMN score ENUM('hot', 'warm', 'cold') DEFAULT 'cold',
                ADD COLUMN stage ENUM('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost') DEFAULT 'new',
                ADD COLUMN tags JSON,
                ADD COLUMN owner VARCHAR(100) DEFAULT 'unassigned';
            `);

            // orders table updates (for deals/proposals)
            await connection.execute(`
                ALTER TABLE orders
                ADD COLUMN payment_mode VARCHAR(50),
                ADD COLUMN due_date DATETIME,
                ADD COLUMN proposal_status ENUM('draft', 'sent', 'accepted', 'declined') DEFAULT 'draft';
            `);

            return NextResponse.json({ success: true, message: 'Schema updated successfully' });
        } catch (error: any) {
            // Ignore if columns already exist (simple check)
            if (error.code === 'ER_DUP_FIELDNAME') {
                return NextResponse.json({ success: true, message: 'Schema already updated' });
            }
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
