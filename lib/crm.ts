import pool from '@/lib/db';

export type InteractionType = 'call_log' | 'email_sent' | 'whatsapp_msg' | 'internal_note' | 'system_event';
export type Sentiment = 'positive' | 'neutral' | 'negative';

export async function logInteraction(
    customerId: number | null,
    orderId: number | null,
    type: InteractionType,
    content: string,
    sentiment: Sentiment = 'neutral',
    createdBy: number | null = null // Admin ID
) {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'INSERT INTO interactions (customer_id, order_id, type, content, sentiment, created_by) VALUES (?, ?, ?, ?, ?, ?)',
                [customerId, orderId, type, content, sentiment, createdBy]
            );
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('CRM Log Error:', error);
        // Don't throw, just log error so main flow isn't interrupted
    }
}
