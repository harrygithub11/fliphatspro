const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchemaAndSeed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dbfliphats'
    });

    console.log('=== Checking Schema & Seeding ===\n');

    const tenantId = 'ba60a2bc-2921-43f5-aa81-65dc7ba298e7'; // From previous logs

    // 1. Check Schema of lead_stages
    console.log('Checking lead_stages schema...');
    const [stageCols] = await connection.execute('SHOW COLUMNS FROM lead_stages');
    const stageFields = stageCols.map(c => c.Field);
    console.log('Fields:', stageFields.join(', '));

    // 2. Check Schema of lead_scores
    console.log('\nChecking lead_scores schema...');
    const [scoreCols] = await connection.execute('SHOW COLUMNS FROM lead_scores');
    const scoreFields = scoreCols.map(c => c.Field);
    console.log('Fields:', scoreFields.join(', '));

    // 3. Seed Stages
    const defaultStages = [
        { value: 'new', label: 'New', color: 'blue' },
        { value: 'contacted', label: 'Contacted', color: 'orange' },
        { value: 'qualified', label: 'Qualified', color: 'purple' },
        { value: 'proposal', label: 'Proposal', color: 'indigo' },
        { value: 'won', label: 'Won', color: 'green' },
        { value: 'lost', label: 'Lost', color: 'red' }
    ];

    console.log('\nSeeding Stages...');
    const hasTenantStage = stageFields.includes('tenant_id');

    for (const s of defaultStages) {
        // Construct query based on schema
        let query = 'INSERT INTO lead_stages (';
        let values = [];
        let params = [];

        if (hasTenantStage) {
            values.push('tenant_id');
            params.push(tenantId);
        }

        values.push('value', 'label', 'color');
        params.push(s.value, s.label, s.color);

        // Add order/sequence if exists
        if (stageFields.includes('sequence')) {
            values.push('sequence');
            params.push(defaultStages.indexOf(s));
        } else if (stageFields.includes('order')) {
            values.push('`order`');
            params.push(defaultStages.indexOf(s));
        }

        query += values.join(', ') + ') VALUES (' + values.map(() => '?').join(', ') + ')';

        try {
            await connection.execute(query, params);
            console.log(`   ✓ Added stage: ${s.label}`);
        } catch (e) {
            console.error(`   ✗ Failed ${s.label}:`, e.message);
        }
    }

    // 4. Seed Scores
    const defaultScores = [
        { value: 'cold', label: 'Cold', color: 'blue', emoji: '❄️' },
        { value: 'warm', label: 'Warm', color: 'orange', emoji: '🔥' },
        { value: 'hot', label: 'Hot', color: 'red', emoji: '🚀' }
    ];

    console.log('\nSeeding Scores...');
    const hasTenantScore = scoreFields.includes('tenant_id');

    for (const s of defaultScores) {
        let query = 'INSERT INTO lead_scores (';
        let values = [];
        let params = [];

        if (hasTenantScore) {
            values.push('tenant_id');
            params.push(tenantId);
        }

        values.push('value', 'label', 'color');
        params.push(s.value, s.label, s.color);

        if (scoreFields.includes('emoji')) {
            values.push('emoji');
            params.push(s.emoji);
        }

        query += values.join(', ') + ') VALUES (' + values.map(() => '?').join(', ') + ')';

        try {
            await connection.execute(query, params);
            console.log(`   ✓ Added score: ${s.label}`);
        } catch (e) {
            console.error(`   ✗ Failed ${s.label}:`, e.message);
        }
    }

    await connection.end();
}

checkSchemaAndSeed().catch(console.error);
