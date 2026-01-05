// Utility function to log admin activities
import pool from './db';

export async function logAdminActivity(
    adminId: number,
    actionType: string,
    actionDescription: string,
    entityType?: string,
    entityId?: number,
    ipAddress?: string
) {
    try {
        const connection = await pool.getConnection();

        try {
            await connection.execute(
                `INSERT INTO admin_activity_logs 
                (admin_id, action_type, action_description, entity_type, entity_id, ip_address, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [adminId, actionType, actionDescription, entityType || null, entityId || null, ipAddress || null]
            );
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging failures shouldn't break the main operation
    }
}
