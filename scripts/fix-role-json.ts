
import mysql from 'mysql2/promise'

const OWNER_PERMISSIONS = {
    contacts: { view: 'all', edit: 'all', delete: 'all', export: true },
    leads: { view: 'all', edit: 'all', delete: 'all', export: true },
    deals: { view: 'all', edit: 'all', delete: 'all' },
    team: { manage: true, invite: true },
    settings: { billing: true, system: true }
};

async function fix() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'flipuser',
            password: 'flippass123',
            database: 'fliphatspro'
        });
        console.log('Connected to DB');

        await connection.execute(
            `UPDATE tenant_roles SET permissions = ? WHERE id = 1`,
            [JSON.stringify(OWNER_PERMISSIONS)]
        );
        console.log('Updated Role 1 Permissions JSON.');

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (connection) connection.end();
    }
}

fix();
