/**
 * Health Check API
 * Used by Docker healthcheck and load balancers
 */

import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: 'unknown',
            memory: 'unknown',
        },
    };

    try {
        // Check database connection
        const connection = await pool.getConnection();
        await connection.execute('SELECT 1');
        connection.release();
        health.checks.database = 'connected';
    } catch (error) {
        health.checks.database = 'disconnected';
        health.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    health.checks.memory = `${heapUsedMB}MB / ${heapTotalMB}MB`;

    const statusCode = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, { status: statusCode });
}
