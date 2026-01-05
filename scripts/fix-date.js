const mysql = require('mysql2/promise');

async function setDate() {
    try {
        const c = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'newyearlp'
        });

        console.log('Connected to database...');

        await c.execute(`
            INSERT INTO system_settings (\`key\`, value, description, updated_at) 
            VALUES ('newyear_offer_date', '2026-01-20T00:00', 'End date for New Year Offer (5k)', NOW()) 
            ON DUPLICATE KEY UPDATE value='2026-01-20T00:00', updated_at=NOW()
        `);

        console.log('✅ Date correctly set to Jan 20th, 2026!');
        await c.end();
    } catch (err) {
        console.error('Error:', err);
    }
}

setDate();
