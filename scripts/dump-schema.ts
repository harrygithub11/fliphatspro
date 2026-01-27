
import mysql from 'mysql2/promise'
import fs from 'fs'

async function dumpSchema() {
    let connection;
    const outputPath = 'C:/Users/MISHTY5626/.gemini/antigravity/brain/43d4cd1d-894f-45ed-8aed-f48539dcd6d8/database_schema.md';
    let output = '';

    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });

        // Get all tables
        const [tables]: any = await connection.execute(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'fliphatspro' ORDER BY TABLE_NAME"
        );

        output += '# FliphatsPro Database Structure\n\n';
        output += `**Total Tables:** ${tables.length}\n\n`;
        output += '---\n\n';

        for (const t of tables) {
            const tableName = t.TABLE_NAME;
            output += `## ${tableName}\n\n`;

            // Get columns
            const [cols]: any = await connection.execute(
                `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA 
                 FROM information_schema.COLUMNS 
                 WHERE TABLE_SCHEMA = 'fliphatspro' AND TABLE_NAME = ?
                 ORDER BY ORDINAL_POSITION`,
                [tableName]
            );

            output += '| Column | Type | Key |\n';
            output += '|--------|------|-----|\n';
            for (const c of cols) {
                const key = c.COLUMN_KEY === 'PRI' ? '🔑 PK' : (c.COLUMN_KEY === 'MUL' ? 'FK' : '-');
                output += `| \`${c.COLUMN_NAME}\` | ${c.COLUMN_TYPE} | ${key} |\n`;
            }
            output += '\n---\n\n';
        }

        fs.writeFileSync(outputPath, output, 'utf8');
        console.log('Schema written to:', outputPath);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

dumpSchema();
