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

        // 1.5 Verify Token
        console.log('Verifying Token Owner...');
        const verifyRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${pageAccessToken}`);
        const verifyData = await verifyRes.json();

        if (verifyData.error) {
            throw new Error('Token is Invalid: ' + verifyData.error.message);
        }

        console.log(`Token belongs to: "${verifyData.name}" (ID: ${verifyData.id})`);

        if (verifyData.id !== pageId) {
            console.error('\n❌ CRITICAL ERROR: TOKEN MISMATCH');
            console.error(`You provided a token for: ${verifyData.name} (ID: ${verifyData.id})`);
            console.error(`But we need a token for Page ID: ${pageId}`);
            console.error('--> This is likely a USER Token. You must generate a PAGE Token.');
            console.error('--> In Graph API Explorer, select your PAGE from the "User or Page" dropdown.');
            return;
        }

        // 2. Call Graph API to subscribe
        console.log('Token matches Page ID! Subscribing App to Page (leadgen)...');
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
