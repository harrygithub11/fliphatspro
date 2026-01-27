const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('Connected! Applying schema fixes...\n');

    try {
        // Add deleted_at to customers
        try {
            await connection.execute('ALTER TABLE customers ADD COLUMN deleted_at DATETIME NULL');
            console.log('✓ Added deleted_at to customers');
        } catch (e) {
            if (e.errno === 1060) console.log('✓ customers.deleted_at already exists');
            else console.error('✗ customers.deleted_at:', e.message);
        }

        // Add company_id to customers
        try {
            await connection.execute('ALTER TABLE customers ADD COLUMN company_id INT');
            console.log('✓ Added company_id to customers');
        } catch (e) {
            if (e.errno === 1060) console.log('✓ customers.company_id already exists');
            else console.error('✗ customers.company_id:', e.message);
        }

        // Add deleted_at to orders
        try {
            await connection.execute('ALTER TABLE orders ADD COLUMN deleted_at DATETIME NULL');
            console.log('✓ Added deleted_at to orders');
        } catch (e) {
            if (e.errno === 1060) console.log('✓ orders.deleted_at already exists');
            else console.error('✗ orders.deleted_at:', e.message);
        }

        // Add deleted_at to tasks
        try {
            await connection.execute('ALTER TABLE tasks ADD COLUMN deleted_at DATETIME NULL');
            console.log('✓ Added deleted_at to tasks');
        } catch (e) {
            if (e.errno === 1060) console.log('✓ tasks.deleted_at already exists');
            else console.error('✗ tasks.deleted_at:', e.message);
        }

        // Add deleted_at to deals
        try {
            await connection.execute('ALTER TABLE deals ADD COLUMN deleted_at DATETIME NULL');
            console.log('✓ Added deleted_at to deals');
        } catch (e) {
            if (e.errno === 1060) console.log('✓ deals.deleted_at already exists');
            else console.error('✗ deals.deleted_at:', e.message);
        }

        // Create files table
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
            console.log('✓ Created/verified files table');
        } catch (e) {
            console.error('✗ files table:', e.message);
        }

        console.log('\n✅ Schema fixes completed!');
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

fixSchema().catch(console.error);
