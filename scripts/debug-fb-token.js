require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function debugToken() {
    console.log('🕵️  Debugging Facebook Token...');

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
        // 1. Get Token from DB
        const [rows] = await connection.execute(
            "SELECT value FROM system_settings WHERE `key` = 'fb_access_token'"
        );

        if (rows.length === 0) {
            console.error('❌ No Access Token found in system_settings!');
            return;
        }

        const userAccessToken = rows[0].value;
        const appId = process.env.NEXT_PUBLIC_FB_APP_ID || '1146387040212629'; // Fallback to known ID if env missing
        const appSecret = process.env.FB_APP_SECRET || 'f3a67d0224bf836480c51121df757656'; // Fallback

        console.log(`🔑 Token found (starts with): ${userAccessToken.substring(0, 10)}...`);

        // 2. Call Standard Debug Endpoint
        // We need an App Access Token to debug a User Access Token
        // App Token = AppID|AppSecret
        const debugexUrl = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${appId}|${appSecret}`;

        const res = await fetch(debugexUrl);
        const data = await res.json();

        if (data.error) {
            console.error('❌ Facebook Error:', data.error.message);
            return;
        }

        const info = data.data;
        console.log('\n--- TOKEN INFO ---');
        console.log(`Type:       ${info.type}`);
        console.log(`Valid:      ${info.is_valid ? '✅ Yes' : '❌ NO'}`);
        console.log(`Expires At: ${new Date(info.expires_at * 1000).toLocaleString()}`);
        console.log(`User ID:    ${info.user_id}`);

        console.log('\n--- PERMISSIONS (SCOPES) ---');
        const scopes = info.scopes || [];
        const required = ['pages_show_list', 'pages_manage_ads', 'leads_retrieval', 'pages_read_engagement'];

        required.forEach(req => {
            const hasIt = scopes.includes(req);
            console.log(`${hasIt ? '✅' : '❌'} ${req}`);
        });

        console.log('\n--- OTHER SCOPES ---');
        console.log(scopes.filter(s => !required.includes(s)).join(', '));

    } catch (error) {
        console.error('System Error:', error);
    } finally {
        await connection.end();
    }
}

debugToken();
