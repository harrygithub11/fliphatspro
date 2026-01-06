const mysql = require('mysql2/promise');
require('dotenv').config();

async function subscribeApp() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        // 1. Fetch access token from settings
        console.log('Fetching Facebook Page Access Token from settings...');
        const [rows] = await connection.execute(`
            SELECT \`value\` FROM system_settings WHERE \`key\` = 'facebook_access_token'
        `);

        if (rows.length === 0 || !rows[0].value) {
            throw new Error('No facebook_access_token found in system_settings table. Please save it in the Admin Dashboard first.');
        }

        const pageAccessToken = rows[0].value;
        const pageIdRow = await connection.execute(`SELECT \`value\` FROM system_settings WHERE \`key\` = 'facebook_page_id'`);
        const pageId = pageIdRow[0][0]?.value;

        console.log(`Found Access Token for Page ID: ${pageId}`);

        // 2. Call Graph API to subscribe
        console.log('Subscribing App to Page (leadgen)...');
        const url = `https://graph.facebook.com/v18.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`;

        const response = await fetch(url, { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            console.log('✅ SUCCESS! The App is now explicitly subscribed to the Page.');
            console.log('You can now use the Lead Ads Testing Tool without the "No app associated" error.');
        } else {
            console.error('❌ FAILED to subscribe.');
            console.error('Facebook Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await connection.end();
    }
}

subscribeApp();
