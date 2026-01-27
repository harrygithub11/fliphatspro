const mysql = require('mysql2/promise');
require('dotenv').config();

async function dropAndRecreateFilesTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Recreating Files Table ===\n');

    // Backup existing data
    console.log('1. Backing up existing data...');
    const [existingData] = await connection.execute('SELECT * FROM files');
    console.log(`   Found ${existingData.length} existing records`);

    // Drop the table
    console.log('\n2. Dropping old files table...');
    await connection.execute('DROP TABLE IF EXISTS files');
    console.log('   ✓ Table dropped');

    // Recreate with proper schema
    console.log('\n3. Creating new files table with deleted_at...');
    await connection.execute(`
        CREATE TABLE files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id VARCHAR(191) NOT NULL,
            customer_id INT NULL,
            uploaded_by INT NOT NULL,
            file_name VARCHAR(191) NOT NULL,
            file_url VARCHAR(500) NOT NULL,
            file_type VARCHAR(191) NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            INDEX idx_tenant (tenant_id),
            INDEX idx_customer (customer_id)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('   ✓ Table created with deleted_at column');

    // Restore data
    if (existingData.length > 0) {
        console.log('\n4. Restoring data...');
        for (const row of existingData) {
            await connection.execute(
                'INSERT INTO files (id, tenant_id, customer_id, uploaded_by, file_name, file_url, file_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [row.id, row.tenant_id, row.customer_id, row.uploaded_by, row.file_name, row.file_url, row.file_type, row.created_at]
            );
        }
        console.log(`   ✓ Restored ${existingData.length} records`);
    }

    // Verify
    console.log('\n5. Verifying...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM files');
    console.log('   Table structure:');
    columns.forEach((col) => {
        console.log(`   - ${col.Field} (${col.Type})`);
    });

    const hasDeletedAt = columns.some((col) => col.Field === 'deleted_at');
    console.log(`\n   ${hasDeletedAt ? '✅' : '❌'} deleted_at column ${hasDeletedAt ? 'EXISTS' : 'MISSING'}`);

    await connection.end();
    console.log('\n=== Complete! Restart your dev server now. ===');
}

dropAndRecreateFilesTable().catch(console.error);
