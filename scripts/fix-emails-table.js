const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixEmailsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Fixing Emails Table ===\n');

    // Check current structure
    console.log('1. Checking emails table structure...');
    const [columns] = await connection.execute('SHOW COLUMNS FROM emails');
    console.log('   Current columns:', columns.map(c => c.Field).join(', '));

    // Add missing columns
    console.log('\n2. Adding missing columns...');

    try {
        await connection.execute('ALTER TABLE emails ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE');
        console.log('   ✓ Added has_attachments');
    } catch (e) {
        if (e.errno === 1060) console.log('   ✓ has_attachments already exists');
        else console.error('   ✗ has_attachments:', e.message);
    }

    try {
        await connection.execute('ALTER TABLE emails ADD COLUMN attachment_count INT DEFAULT 0');
        console.log('   ✓ Added attachment_count');
    } catch (e) {
        if (e.errno === 1060) console.log('   ✓ attachment_count already exists');
        else console.error('   ✗ attachment_count:', e.message);
    }

    // Verify
    console.log('\n3. Verifying...');
    const [newColumns] = await connection.execute('SHOW COLUMNS FROM emails');
    const hasAttachments = newColumns.some(c => c.Field === 'has_attachments');
    const hasCount = newColumns.some(c => c.Field === 'attachment_count');

    console.log(`   ${hasAttachments ? '✅' : '❌'} has_attachments ${hasAttachments ? 'exists' : 'missing'}`);
    console.log(`   ${hasCount ? '✅' : '❌'} attachment_count ${hasCount ? 'exists' : 'missing'}`);

    await connection.end();
    console.log('\n=== Complete! ===');
}

fixEmailsTable().catch(console.error);
