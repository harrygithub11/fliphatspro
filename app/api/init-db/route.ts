import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const schemaPath = path.join(process.cwd(), 'database_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by ';' but allow for comments and newlines. 
        // Simple split might fail on complex bodies, but for this schema it's fine.
        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        const connection = await pool.getConnection();
        try {
            for (const statement of statements) {
                // Skip empty or comment-only lines if any sneak through
                if (statement.startsWith('--')) continue;
                await connection.query(statement);
            }
            return NextResponse.json({ success: true, message: 'Database initialized successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Init DB Error:", error);
        return NextResponse.json({ error: 'Failed to initialize DB', details: error }, { status: 500 });
    }
}
