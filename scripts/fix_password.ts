import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
    const connection = await mysql.createConnection({
        host: '127.0.0.1',
        user: 'root',
        password: '',
        database: 'dbfliphats'
    });

    // Proper bcrypt hash for 'harish123'
    const hash = '$2b$10$8ApGoIzmNd9/XX0sIGuc6.7EmTjP0qAMM0mpbwC61rDWFZh4z/aim';

    await connection.execute(
        'UPDATE users SET password_hash = ? WHERE email = ?',
        [hash, 'harrymailbox11@gmail.com']
    );

    // Verify
    const [rows]: any = await connection.execute(
        'SELECT password_hash FROM users WHERE email = ?',
        ['harrymailbox11@gmail.com']
    );

    console.log('Updated hash:', rows[0].password_hash);
    console.log('Expected:', hash);
    console.log('Match:', rows[0].password_hash === hash);

    connection.end();
}

main().catch(console.error);
