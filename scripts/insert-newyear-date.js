const mysql = require('mysql2/promise');

async function insertDate() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'newyearlp'
    });

    console.log('Connected to database...');

    // First, check if the record exists
    const [existing] = await connection.execute(
        'SELECT * FROM system_settings WHERE `key` = ?',
        ['newyear_offer_date']
    );

    console.log('Existing records:', existing);

    if (existing.length === 0) {
        // Insert new record
        await connection.execute(
            'INSERT INTO system_settings (`id`, `key`, `value`, `description`, `updated_at`) VALUES (UUID(), ?, ?, ?, NOW())',
            ['newyear_offer_date', '2026-01-20T00:00', 'End date for New Year Offer (5k)']
        );
        console.log('✅ Inserted newyear_offer_date!');
    } else {
        // Update existing record
        await connection.execute(
            'UPDATE system_settings SET `value` = ?, `updated_at` = NOW() WHERE `key` = ?',
            ['2026-01-20T00:00', 'newyear_offer_date']
        );
        console.log('✅ Updated newyear_offer_date!');
    }

    // Verify insertion
    const [result] = await connection.execute('SELECT * FROM system_settings');
    console.log('\nAll settings in database:');
    result.forEach(row => {
        console.log(`  ${row.key}: ${row.value}`);
    });

    await connection.end();
}

insertDate().catch(console.error);
