
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, customer_id, due_date, priority } = body;

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO tasks (title, customer_id, due_date, priority, status) VALUES (?, ?, ?, ?, ?)',
                [title, customer_id, due_date || null, priority || 'medium', 'open']
            );
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Create Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id || Object.keys(updates).length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid update' }, { status: 400 });
        }

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(', ');

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `UPDATE tasks SET ${setClause} WHERE id = ?`,
                [...values, id]
            );
            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Task Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to update task' }, { status: 500 });
    }
}
