const mysql = require('mysql2/promise');

(async () => {
    try {
        const c = await mysql.createConnection({ host: '127.0.0.1', user: 'flipuser', password: 'flippass123', database: 'fliphatspro' });
        const [rows] = await c.execute('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        console.log('Tables:');
        tables.forEach(t => console.log(t));

        console.log('\nMatching "lead":');
        tables.filter(t => t.toLowerCase().includes('lead')).forEach(t => console.log(t));

        await c.end();
    } catch (e) {
        console.error('Error:', e);
    }
})();
