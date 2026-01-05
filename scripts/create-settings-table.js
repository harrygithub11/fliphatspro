const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSettingsTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creating settings table...');

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT,
                description VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('✓ Settings table created successfully');

        // Insert default values
        const defaultSettings = [
            { key: 'site_name', value: 'FliphatMedia', description: 'Site name' },
            { key: 'offer_end_date', value: '2026-12-31T23:59', description: 'Lifetime Offer (12k) end date' },
            { key: 'newyear_offer_date', value: '2026-01-31T23:59', description: 'New Year Offer (5k) end date' }
        ];

        for (const setting of defaultSettings) {
            await connection.execute(
                'INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                [setting.key, setting.value, setting.description]
            );
        }

        console.log('✓ Default settings inserted');

        const [rows] = await connection.execute('SELECT * FROM settings');
        console.log('\nCurrent settings:');
        console.table(rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

createSettingsTable();
