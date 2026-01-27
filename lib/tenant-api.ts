/**
 * Tenant-Aware API Helper
 * 
 * Simplifies making API routes tenant-aware with minimal code changes.
 * Use this for quick migration of existing routes.
 */

import { NextResponse } from 'next/server';
import { requireTenantAuth, getSession } from '@/lib/auth';
import pool from '@/lib/db';
import type { PoolConnection } from 'mysql2/promise';

interface TenantContext {
    tenantId: string;
    userId: number;
    userEmail: string;
    tenantRole: string | null;
    connection: PoolConnection;
}

/**
 * Wraps an API handler with tenant context and database connection.
 * Automatically handles auth, tenant resolution, and connection cleanup.
 * 
 * @example
 * export async function GET(request: Request) {
 *     return withTenantContext(request, async ({ tenantId, connection }) => {
 *         const [rows] = await connection.execute(
 *             'SELECT * FROM customers WHERE tenant_id = ?',
 *             [tenantId]
 *         );
 *         return NextResponse.json(rows);
 *     });
 * }
 */
export async function withTenantContext<T>(
    request: Request,
    handler: (ctx: TenantContext) => Promise<T>
): Promise<T | NextResponse> {
    let connection: PoolConnection | null = null;

    try {
        const { session, tenantId, tenantRole } = await requireTenantAuth(request);

        connection = await pool.getConnection();

        const result = await handler({
            tenantId,
            userId: session.id,
            userEmail: session.email,
            tenantRole,
            connection,
        });

        return result;
    } catch (error: any) {
        console.error('API Error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (error.message === 'No tenant context') {
            return NextResponse.json({ error: 'No workspace selected' }, { status: 400 });
        }

        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

/**
 * Helper to add tenant_id filter to a WHERE clause
 */
export function tenantWhere(tenantId: string, existingWhere?: string): string {
    if (existingWhere) {
        return `${existingWhere} AND tenant_id = '${tenantId}'`;
    }
    return `WHERE tenant_id = '${tenantId}'`;
}

/**
 * Quick tenant-scoped query helper
 */
export async function tenantQuery(
    connection: PoolConnection,
    table: string,
    tenantId: string,
    options?: {
        select?: string;
        where?: string;
        orderBy?: string;
        limit?: number;
        params?: any[];
    }
): Promise<any[]> {
    const {
        select = '*',
        where = '',
        orderBy = '',
        limit,
        params = [],
    } = options || {};

    let query = `SELECT ${select} FROM ${table} WHERE tenant_id = ?`;
    const queryParams = [tenantId, ...params];

    if (where) {
        query += ` AND ${where}`;
    }
    if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
    }
    if (limit) {
        query += ` LIMIT ${limit}`;
    }

    const [rows]: any = await connection.execute(query, queryParams);
    return rows;
}

/**
 * Insert with tenant_id
 */
export async function tenantInsert(
    connection: PoolConnection,
    table: string,
    tenantId: string,
    data: Record<string, any>
): Promise<number> {
    const dataWithTenant = { tenant_id: tenantId, ...data };
    const columns = Object.keys(dataWithTenant);
    const values = Object.values(dataWithTenant);
    const placeholders = columns.map(() => '?').join(', ');

    const [result]: any = await connection.execute(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
    );

    return result.insertId;
}

/**
 * Update with tenant_id check
 */
export async function tenantUpdate(
    connection: PoolConnection,
    table: string,
    tenantId: string,
    id: number | string,
    data: Record<string, any>
): Promise<boolean> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map(c => `${c} = ?`).join(', ');

    const [result]: any = await connection.execute(
        `UPDATE ${table} SET ${setClause} WHERE id = ? AND tenant_id = ?`,
        [...values, id, tenantId]
    );

    return result.affectedRows > 0;
}

/**
 * Delete with tenant_id check
 */
export async function tenantDelete(
    connection: PoolConnection,
    table: string,
    tenantId: string,
    id: number | string
): Promise<boolean> {
    const [result]: any = await connection.execute(
        `DELETE FROM ${table} WHERE id = ? AND tenant_id = ?`,
        [id, tenantId]
    );

    return result.affectedRows > 0;
}
