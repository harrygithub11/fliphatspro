/**
 * Tenant-Scoped Database Utilities
 * 
 * Provides a safe, tenant-aware abstraction over database operations.
 * All queries automatically include tenant_id filtering to ensure data isolation.
 */

import pool from './db';
import { getCurrentTenantId } from './tenant-context';

// ============================================
// TYPES
// ============================================

export interface QueryResult<T> {
    data: T[];
    count: number;
}

export interface InsertResult {
    insertId: number;
    affectedRows: number;
}

export interface UpdateResult {
    affectedRows: number;
    changedRows: number;
}

// ============================================
// TENANT-SCOPED QUERY CLASS
// ============================================

export class TenantScopedQuery {
    private tenantId: string;

    constructor(tenantId?: string) {
        const resolvedTenantId = tenantId || getCurrentTenantId();

        if (!resolvedTenantId) {
            throw new Error('Tenant context required for this operation. No tenant ID provided or found in context.');
        }

        this.tenantId = resolvedTenantId;
    }

    /**
     * Get the current tenant ID
     */
    getTenantId(): string {
        return this.tenantId;
    }

    /**
     * Execute a raw SQL query with tenant context
     * The query should NOT include tenant_id filtering - it will be added automatically
     */
    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows as T[];
        } finally {
            connection.release();
        }
    }

    /**
     * Execute a tenant-scoped SELECT query
     * Automatically adds WHERE tenant_id = ? filter
     */
    async select<T = any>(
        table: string,
        options: {
            columns?: string[];
            where?: string;
            params?: any[];
            orderBy?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<T[]> {
        const {
            columns = ['*'],
            where = '',
            params = [],
            orderBy = '',
            limit,
            offset,
        } = options;

        let sql = `SELECT ${columns.join(', ')} FROM ${table} WHERE tenant_id = ?`;
        const queryParams = [this.tenantId, ...params];

        if (where) {
            sql += ` AND (${where})`;
        }

        if (orderBy) {
            sql += ` ORDER BY ${orderBy}`;
        }

        if (limit !== undefined) {
            sql += ` LIMIT ?`;
            queryParams.push(limit);
        }

        if (offset !== undefined) {
            sql += ` OFFSET ?`;
            queryParams.push(offset);
        }

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.execute(sql, queryParams);
            return rows as T[];
        } finally {
            connection.release();
        }
    }

    /**
     * Find a single record by ID (tenant-scoped)
     */
    async findById<T = any>(table: string, id: number | string, idColumn: string = 'id'): Promise<T | null> {
        const rows = await this.select<T>(table, {
            where: `${idColumn} = ?`,
            params: [id],
            limit: 1,
        });

        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * Insert a record with automatic tenant_id
     */
    async insert(table: string, data: Record<string, any>): Promise<InsertResult> {
        const connection = await pool.getConnection();
        try {
            // Add tenant_id to data
            const dataWithTenant = { tenant_id: this.tenantId, ...data };

            const columns = Object.keys(dataWithTenant);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(dataWithTenant);

            const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
            const [result]: any = await connection.execute(sql, values);

            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows,
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Insert multiple records with automatic tenant_id
     */
    async insertMany(table: string, records: Record<string, any>[]): Promise<InsertResult> {
        if (records.length === 0) {
            return { insertId: 0, affectedRows: 0 };
        }

        const connection = await pool.getConnection();
        try {
            // Add tenant_id to all records
            const recordsWithTenant = records.map(r => ({ tenant_id: this.tenantId, ...r }));

            const columns = Object.keys(recordsWithTenant[0]);
            const placeholders = `(${columns.map(() => '?').join(', ')})`;
            const allPlaceholders = recordsWithTenant.map(() => placeholders).join(', ');
            const values = recordsWithTenant.flatMap(r => Object.values(r));

            const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${allPlaceholders}`;
            const [result]: any = await connection.execute(sql, values);

            return {
                insertId: result.insertId,
                affectedRows: result.affectedRows,
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Update records (tenant-scoped)
     */
    async update(
        table: string,
        data: Record<string, any>,
        where: string,
        whereParams: any[] = []
    ): Promise<UpdateResult> {
        const connection = await pool.getConnection();
        try {
            const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const values = [...Object.values(data), this.tenantId, ...whereParams];

            const sql = `UPDATE ${table} SET ${setClauses} WHERE tenant_id = ? AND (${where})`;
            const [result]: any = await connection.execute(sql, values);

            return {
                affectedRows: result.affectedRows,
                changedRows: result.changedRows,
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Update a single record by ID (tenant-scoped)
     */
    async updateById(
        table: string,
        id: number | string,
        data: Record<string, any>,
        idColumn: string = 'id'
    ): Promise<UpdateResult> {
        return this.update(table, data, `${idColumn} = ?`, [id]);
    }

    /**
     * Delete records (tenant-scoped)
     */
    async delete(table: string, where: string, whereParams: any[] = []): Promise<UpdateResult> {
        const connection = await pool.getConnection();
        try {
            const sql = `DELETE FROM ${table} WHERE tenant_id = ? AND (${where})`;
            const [result]: any = await connection.execute(sql, [this.tenantId, ...whereParams]);

            return {
                affectedRows: result.affectedRows,
                changedRows: 0,
            };
        } finally {
            connection.release();
        }
    }

    /**
     * Delete a single record by ID (tenant-scoped)
     */
    async deleteById(table: string, id: number | string, idColumn: string = 'id'): Promise<UpdateResult> {
        return this.delete(table, `${idColumn} = ?`, [id]);
    }

    /**
     * Count records (tenant-scoped)
     */
    async count(table: string, where?: string, whereParams: any[] = []): Promise<number> {
        const connection = await pool.getConnection();
        try {
            let sql = `SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = ?`;
            const params = [this.tenantId, ...whereParams];

            if (where) {
                sql += ` AND (${where})`;
            }

            const [rows]: any = await connection.execute(sql, params);
            return rows[0].count;
        } finally {
            connection.release();
        }
    }

    /**
     * Check if a record exists (tenant-scoped)
     */
    async exists(table: string, where: string, whereParams: any[] = []): Promise<boolean> {
        const count = await this.count(table, where, whereParams);
        return count > 0;
    }

    /**
     * Execute a transaction with tenant context
     */
    async transaction<T>(callback: (trx: TransactionContext) => Promise<T>): Promise<T> {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const trx = new TransactionContext(connection, this.tenantId);
            const result = await callback(trx);

            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

// ============================================
// TRANSACTION CONTEXT
// ============================================

class TransactionContext {
    private connection: any;
    private tenantId: string;

    constructor(connection: any, tenantId: string) {
        this.connection = connection;
        this.tenantId = tenantId;
    }

    async insert(table: string, data: Record<string, any>): Promise<InsertResult> {
        const dataWithTenant = { tenant_id: this.tenantId, ...data };
        const columns = Object.keys(dataWithTenant);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(dataWithTenant);

        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        const [result]: any = await this.connection.execute(sql, values);

        return {
            insertId: result.insertId,
            affectedRows: result.affectedRows,
        };
    }

    async update(
        table: string,
        data: Record<string, any>,
        where: string,
        whereParams: any[] = []
    ): Promise<UpdateResult> {
        const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(data), this.tenantId, ...whereParams];

        const sql = `UPDATE ${table} SET ${setClauses} WHERE tenant_id = ? AND (${where})`;
        const [result]: any = await this.connection.execute(sql, values);

        return {
            affectedRows: result.affectedRows,
            changedRows: result.changedRows,
        };
    }

    async delete(table: string, where: string, whereParams: any[] = []): Promise<UpdateResult> {
        const sql = `DELETE FROM ${table} WHERE tenant_id = ? AND (${where})`;
        const [result]: any = await this.connection.execute(sql, [this.tenantId, ...whereParams]);

        return {
            affectedRows: result.affectedRows,
            changedRows: 0,
        };
    }

    async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        const [rows] = await this.connection.execute(sql, params);
        return rows as T[];
    }
}

// ============================================
// FACTORY FUNCTIONS
// ============================================

/**
 * Get a tenant-scoped database instance
 */
export function getTenantDb(tenantId?: string): TenantScopedQuery {
    return new TenantScopedQuery(tenantId);
}

/**
 * Require tenant context - throws if not available
 */
export function requireTenantDb(): TenantScopedQuery {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
        throw new Error('Tenant context required. User must be authenticated with a selected tenant.');
    }
    return new TenantScopedQuery(tenantId);
}

// ============================================
// RAW QUERY HELPERS (for complex joins)
// ============================================

/**
 * Execute a raw query that includes tenant_id filtering
 * Use this for complex queries with JOINs where automatic tenant_id injection doesn't work
 */
export async function rawTenantQuery<T = any>(
    sql: string,
    tenantId: string,
    params: any[] = []
): Promise<T[]> {
    const connection = await pool.getConnection();
    try {
        // Replace {{tenant_id}} placeholder with actual tenant_id
        const processedSql = sql.replace(/\{\{tenant_id\}\}/g, '?');
        const tenantIdCount = (sql.match(/\{\{tenant_id\}\}/g) || []).length;
        const tenantIds = Array(tenantIdCount).fill(tenantId);

        const [rows] = await connection.execute(processedSql, [...tenantIds, ...params]);
        return rows as T[];
    } finally {
        connection.release();
    }
}
