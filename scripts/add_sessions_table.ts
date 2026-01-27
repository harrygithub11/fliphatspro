import mysql from 'mysql2/promise';

async function main() {
    const c = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    console.log('Creating active_sessions...');
    await c.execute(`
        CREATE TABLE IF NOT EXISTS active_sessions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            session_token VARCHAR(255) NOT NULL UNIQUE,
            is_revoked BOOLEAN DEFAULT FALSE,
            ip_address VARCHAR(50),
            user_agent TEXT,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_token (session_token)
        )
    `);

    console.log('✅ active_sessions table created!');
    c.end();
}

main().catch(console.error);
