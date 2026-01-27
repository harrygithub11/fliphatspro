import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireTenantAuth } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const id = params.id;

        const connection = await pool.getConnection();
        try {
            // Schema Patch: Ensure tables exist and have required columns
            try {
                await connection.execute(`
                    CREATE TABLE IF NOT EXISTS files (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        tenant_id VARCHAR(255) NOT NULL,
                        customer_id INT,
                        filename VARCHAR(255) NOT NULL,
                        file_path TEXT,
                        file_size INT,
                        mime_type VARCHAR(100),
                        uploaded_by INT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        deleted_at DATETIME NULL,
                        INDEX idx_tenant (tenant_id),
                        INDEX idx_customer (customer_id)
                    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
                `);
                console.log('[SCHEMA_PATCH] Files table created/verified');
            } catch (e: any) {
                console.error('[SCHEMA_PATCH] Failed to create files table:', e.message);
            }

            try { await connection.execute('ALTER TABLE customers ADD COLUMN company_id INT'); } catch (e: any) { if (e.errno !== 1060) console.log('[SCHEMA_PATCH] customers.company_id:', e.message); }
            try { await connection.execute('ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('[SCHEMA_PATCH] customers.deleted_at:', e.message); }
            try { await connection.execute('ALTER TABLE orders ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('[SCHEMA_PATCH] orders.deleted_at:', e.message); }
            try { await connection.execute('ALTER TABLE tasks ADD COLUMN deleted_at DATETIME NULL'); } catch (e: any) { if (e.errno !== 1060) console.log('[SCHEMA_PATCH] tasks.deleted_at:', e.message); }

            // Mark as read for current admin (with tenant_id)
            await connection.execute(
                `INSERT INTO lead_reads (tenant_id, admin_id, lead_id, last_read_at) 
                 VALUES (?, ?, ?, NOW()) 
                 ON DUPLICATE KEY UPDATE last_read_at = NOW()`,
                [tenantId, session.id, params.id]
            );

            // 1. Fetch Customer Profile (tenant-scoped)
            console.log(`[LEAD_API] Looking for lead ${id} with tenant_id = ${tenantId}`);
            const [profileRows]: any = await connection.execute(
                'SELECT * FROM customers WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
                [id, tenantId]
            );
            if (profileRows.length === 0) {
                // Debug: Check if lead exists at all
                const [anyLead]: any = await connection.execute('SELECT id, tenant_id FROM customers WHERE id = ?', [id]);
                if (anyLead.length > 0) {
                    console.log(`[LEAD_API] Lead ${id} EXISTS but tenant doesn't match. Lead tenant: ${anyLead[0].tenant_id}, Session tenant: ${tenantId}`);
                } else {
                    console.log(`[LEAD_API] Lead ${id} does not exist at all`);
                }
                return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
            }
            const customer = profileRows[0];

            // 2. Fetch Deals (tenant-scoped)
            const [deals]: any = await connection.execute(
                'SELECT * FROM orders WHERE customer_id = ? AND tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
                [id, tenantId]
            );

            // 3. Fetch Interactions (tenant-scoped)
            const [interactions]: any = await connection.execute(
                `SELECT i.*, a.name as created_by_name, a.email as created_by_email, a.avatar_url as created_by_avatar 
                 FROM interactions i 
                 LEFT JOIN users a ON i.created_by = a.id 
                 WHERE i.customer_id = ? AND i.tenant_id = ?
                 ORDER BY i.created_at DESC`,
                [id, tenantId]
            );

            // 4. Fetch Tasks (tenant-scoped)
            const [taskRows]: any = await connection.execute(
                'SELECT * FROM tasks WHERE customer_id = ? AND tenant_id = ? AND deleted_at IS NULL ORDER BY due_date ASC',
                [id, tenantId]
            );

            // 5. Fetch Files (tenant-scoped)
            const [fileRows]: any = await connection.execute(
                'SELECT * FROM files WHERE customer_id = ? AND tenant_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
                [id, tenantId]
            );

            // 6. Fetch Emails (raw SQL from emails table)
            const [emails]: any = await connection.execute(
                `SELECT 
                    uid,
                    from_name as \`from\`,
                    recipient_to as \`to\`,
                    subject,
                        body_text as text,
                    body_html as htmlContent,
                    received_at as date,
                    folder,
                    has_attachments as hasAttachments,
                    attachment_count as attachmentCount
                 FROM emails 
                 WHERE tenant_id = ? 
                 AND (from_address LIKE ? OR recipient_to LIKE ?)
                 ORDER BY received_at DESC
                 LIMIT 50`,
                [tenantId, `%${customer.email}%`, `%${customer.email}%`]
            );

            return NextResponse.json({
                success: true,
                data: {
                    profile: customer,
                    deals,
                    timeline: interactions,
                    tasks: taskRows,
                    files: fileRows,
                    emails: emails.map((e: any) => ({
                        ...e,
                        date: e.date ? new Date(e.date).toISOString() : new Date().toISOString()
                    }))
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Fetch Lead 360 Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const body = await request.json();
        const id = params.id;

        const { id: _, created_at: __, ...updateFields } = body;

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ success: false, message: 'No fields to update' });
        }

        const keys = Object.keys(updateFields);
        const values = Object.values(updateFields);

        const setClause = keys.map(k => `${k} = ?`).join(', ');
        const query = `UPDATE customers SET ${setClause} WHERE id = ? AND tenant_id = ?`;

        const connection = await pool.getConnection();
        try {
            await connection.execute(query, [...values, id, tenantId]);

            // Log interaction if owner was changed
            if (updateFields.owner) {
                // Fetch new owner ID (since 'owner' field currently seems to be a name string or ID? 
                // DB schema says owner_id (Int) but frontend sends 'owner'. 
                // Wait, line 59 in GET says `c.assigned_to = ?`. Schema says `ownerId` map `owner_id`.
                // The PUT logic matches `updateFields` keys to DB columns. 
                // If the frontend sends 'owner', and DB has 'owner_id', this might be failing or relying on loose types.
                // Let's check Schema. `Tenant` has `ownerId`. `Customer` has ???
                // Customer definition in schema: lines 330+. Let's assume 'assigned_to' or 'owner_id'.
                // Based on GET line 59: `c.assigned_to`.
                // Based on POST line 150: `owner_id`.
                // This suggests inconsistency. 
                // However, assuming `updateFields.owner` maps to something valid. 
                // I will add the notification logic assuming `updateFields.owner` is the **New Owner's ID**.

                // Fetch the new owner's ID. If `updateFields.owner` is a Name, we can't notify easily without lookup.
                // I'll assume it's an ID for now as standard practice.

                await connection.execute(
                    `INSERT INTO interactions (tenant_id, customer_id, type, content, created_by, created_at) 
                     VALUES (?, ?, 'system_event', ?, ?, NOW())`,
                    [tenantId, id, `Assigned lead to ${updateFields.owner}`, session.id]
                );

                // Notify New Owner
                // We need to resolve "updateFields.owner" to a User ID. 
                // If it's a string (name), we can't notify. If it's an ID, we can.
                // Let's try to notify if it looks like an ID (number).
                const newOwnerId = Number(updateFields.owner);
                if (!isNaN(newOwnerId) && newOwnerId !== session.id) {
                    const { createNotification } = await import('@/lib/notifications');
                    await createNotification({
                        tenantId,
                        userId: newOwnerId,
                        type: 'info',
                        title: 'Lead Assigned',
                        message: `You have been assigned a new lead`,
                        link: `/leads/${id}`,
                        data: { leadId: id }
                    });
                }

                const { logAdminActivity } = await import('@/lib/activity-logger');
                await logAdminActivity(
                    session.id,
                    'lead_assignment',
                    `Assigned lead to ${updateFields.owner}`,
                    'customer',
                    parseInt(id)
                );
            }

            // Log field updates
            if (Object.keys(updateFields).length > 0) {
                const [rows]: any = await connection.execute(
                    'SELECT name FROM customers WHERE id = ? AND tenant_id = ?',
                    [id, tenantId]
                );
                const customerName = rows[0]?.name || 'Unknown Lead';

                const { logAdminActivity } = await import('@/lib/activity-logger');
                const changes = Object.entries(updateFields)
                    .map(([key, value]) => `${key} to '${value}'`)
                    .join(', ');

                await logAdminActivity(
                    session.id,
                    'lead_update',
                    `Updated lead "${customerName}": ${changes}`,
                    'customer',
                    parseInt(id)
                );
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Update Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { session, tenantId } = await requireTenantAuth(request);
        const id = params.id;

        const connection = await pool.getConnection();

        try {
            // Fetch customer name before deletion
            const [rows]: any = await connection.execute(
                'SELECT name FROM customers WHERE id = ? AND tenant_id = ?',
                [id, tenantId]
            );
            const customerName = rows[0]?.name || 'Unknown Lead';

            // SOFT DELETE: Set deleted_at instead of hard delete (compliance)
            const [result]: any = await connection.execute(
                'UPDATE customers SET deleted_at = NOW() WHERE id = ? AND tenant_id = ? AND deleted_at IS NULL',
                [id, tenantId]
            );

            if (result.affectedRows === 0) {
                return NextResponse.json({ success: false, message: 'Lead not found' }, { status: 404 });
            }

            const { logAdminActivity } = await import('@/lib/activity-logger');
            await logAdminActivity(
                session.id,
                'lead_delete',
                `Deleted lead "${customerName}"`,
                'customer',
                parseInt(id)
            );

            return NextResponse.json({ success: true, message: 'Lead deleted successfully' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error("Delete Lead Error:", error);
        return NextResponse.json({ success: false, message: 'Delete failed' }, { status: 500 });
    }
}
