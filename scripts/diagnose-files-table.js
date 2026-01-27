const mysql = require('mysql2/promise');
require('dotenv').config();

async function diagnoseAndFix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== MySQL Table Cache Diagnostic ===\n');

    // Step 1: Flush tables
    console.log('1. Flushing table cache...');
    await connection.execute('FLUSH TABLES');
    console.log('   ✓ Cache flushed\n');

    // Step 2: Check if column exists
    console.log('2. Checking for deleted_at column...');
    const [columns] = await connection.execute(
        'SHOW COLUMNS FROM files WHERE Field = "deleted_at"'
    );

    if (columns.length > 0) {
        console.log('   ✓ Column EXISTS');
        console.log('   Details:', columns[0]);
    } else {
        console.log('   ✗ Column MISSING - Adding it now...');
        await connection.execute('ALTER TABLE files ADD COLUMN deleted_at DATETIME NULL');
        console.log('   ✓ Column added');
        await connection.execute('FLUSH TABLES');
    }

    // Step 3: Test the query
    console.log('\n3. Testing query with deleted_at...');
    try {
        const [rows] = await connection.execute(
            'SELECT * FROM files WHERE deleted_at IS NULL LIMIT 1'
        );
        console.log('   ✓ Query SUCCESS! Found', rows.length, 'rows');
    } catch (error) {
        console.log('   ✗ Query FAILED:', error.message);
    }

    // Step 4: Show all columns
    console.log('\n4. Current files table structure:');
    const [allColumns] = await connection.execute('SHOW COLUMNS FROM files');
    allColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    await connection.end();
    console.log('\n=== Diagnostic Complete ===');
}

diagnoseAndFix().catch(console.error);
