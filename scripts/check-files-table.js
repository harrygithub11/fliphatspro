const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('Checking files table structure...\n');

    try {
        const [rows] = await connection.execute('DESCRIBE files');
        console.log('Files table columns:');
        rows.forEach(row => {
            console.log(`  - ${row.Field} (${row.Type}) ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        const hasDeletedAt = rows.some(row => row.Field === 'deleted_at');
        if (hasDeletedAt) {
            console.log('\n✅ deleted_at column EXISTS in files table');
        } else {
            console.log('\n❌ deleted_at column MISSING from files table');
            console.log('Adding it now...');
            await connection.execute('ALTER TABLE files ADD COLUMN deleted_at DATETIME NULL');
            console.log('✅ Added deleted_at column');
        }
    } catch (error) {
        if (error.errno === 1146) {
            console.log('❌ files table does NOT exist!');
            console.log('Creating it now...');
            await connection.execute(`
                CREATE TABLE files (
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
            console.log('✅ Created files table with deleted_at column');
        } else {
            console.error('Error:', error.message);
        }
    }

    await connection.end();
}

checkSchema().catch(console.error);
