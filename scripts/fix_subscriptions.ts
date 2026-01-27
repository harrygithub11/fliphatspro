import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('Dropping and recreating subscriptions table with correct schema...');

    await c.execute('DROP TABLE IF EXISTS subscriptions');

    await c.execute(`
        CREATE TABLE subscriptions (
            id VARCHAR(36) PRIMARY KEY,
            company_id VARCHAR(36) UNIQUE,
            plan VARCHAR(50) DEFAULT 'free',
            status VARCHAR(50) DEFAULT 'active',
            trial_start TIMESTAMP NULL,
            trial_end TIMESTAMP NULL,
            start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_date TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_status (status),
            INDEX idx_company (company_id)
        )
    `);

    console.log('✅ subscriptions table recreated with correct schema!');
    c.end();
}

main().catch(console.error);
