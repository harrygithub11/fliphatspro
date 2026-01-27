
import mysql from 'mysql2/promise'

async function createDealsTable() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });

        console.log('Connected to DB');

        // Create deals table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS deals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tenant_id VARCHAR(191) NOT NULL,
                contact_id INT,
                customer_id INT,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                amount DECIMAL(12,2) DEFAULT 0.00,
                currency VARCHAR(3) DEFAULT 'INR',
                stage VARCHAR(50) DEFAULT 'lead',
                probability INT DEFAULT 0,
                expected_close_date DATE,
                actual_close_date DATE,
                status ENUM('open', 'won', 'lost') DEFAULT 'open',
                lost_reason TEXT,
                source VARCHAR(100),
                owner_id INT,
                custom_fields JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_tenant_stage (tenant_id, stage),
                INDEX idx_tenant_status (tenant_id, status),
                INDEX idx_tenant_owner (tenant_id, owner_id),
                INDEX idx_customer (customer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ Deals table created!');

        // Verify
        const [tables]: any = await connection.execute("SHOW TABLES LIKE 'deals'");
        console.log('Verification:', tables.length > 0 ? 'Table exists!' : 'Failed');

    } catch (e: any) {
        if (e.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('✅ Deals table already exists');
        } else {
            console.error('Error:', e.message);
        }
    } finally {
        if (connection) connection.end();
    }
}

createDealsTable();
