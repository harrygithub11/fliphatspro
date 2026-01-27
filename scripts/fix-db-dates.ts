
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Script to fix '0000-00-00 00:00:00' dates in database causing Prisma migration failures.
 * This sets updated_at = NOW() where updated_at is zero.
 */

async function main() {
    console.log('Starting DB date fix...');

    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    // List of tables that have updated_at according to schema
    // and might contain legacy data
    const tables = [
        'customers',
        'orders',
        'tasks',
        'users',
        'admins',
        'settings',
        'site_settings',
        'smtp_accounts',
        'emails',
        'deals'
    ];

    try {
        for (const table of tables) {
            try {
                // Check if column exists first to avoid crashing script
                const [cols]: any = await connection.execute(
                    `SHOW COLUMNS FROM ${table} LIKE 'updated_at'`
                );

                if (cols.length > 0) {
                    // Check for bad dates
                    // In MySQL, '0000-00-00' might show as such or NULL depending on mode, 
                    // but strict mode catches it as error on update.
                    // We force update it.

                    // We use a safe UPDATE command.
                    // Note: We are using string comparison for '0000-...' because JS Date can't represent it.
                    // OR we just update everything that CASTS to null or 0.

                    const query = `
                        UPDATE ${table} 
                        SET updated_at = CURRENT_TIMESTAMP 
                        WHERE CAST(updated_at AS CHAR) = '0000-00-00 00:00:00' 
                           OR updated_at IS NULL;
                     `;

                    // Note: updated_at IS NULL check is only if column is nullable.

                    const [res]: any = await connection.execute(query);
                    if (res.affectedRows > 0) {
                        console.log(`Fixed ${res.affectedRows} rows in ${table}`);
                    } else {
                        console.log(`No bad dates in ${table}`);
                    }
                } else {
                    console.log(`Skipping ${table} (no updated_at column)`);
                }
            } catch (err: any) {
                // If table doesn't exist, ignore
                if (!err.message.includes("doesn't exist")) {
                    console.error(`Error processing ${table}:`, err.message);
                }
            }
        }

        console.log("DB Date fix completed.");

    } catch (e) {
        console.error("Fatal error fixing dates:", e);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

main();
