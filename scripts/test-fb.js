const https = require('https');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

console.log('--- Facebook CAPI Test ---');
console.log('Pixel ID:', PIXEL_ID);
console.log('Access Token:', ACCESS_TOKEN ? 'Present (Hidden)' : 'MISSING');
console.log('--------------------------');

if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('❌ ERROR: Missing FACEBOOK_PIXEL_ID or FACEBOOK_ACCESS_TOKEN in .env');
    process.exit(1);
}

const currentTimestamp = Math.floor(Date.now() / 1000);

// Simple hash function for test data
const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');

const payload = JSON.stringify({
    data: [
        {
            event_name: 'TestEvent',
            event_time: currentTimestamp,
            action_source: "website",
            user_data: {
                em: [hash('test@example.com')],
                ph: [hash('1234567890')]
            },
            custom_data: {
                message: "This is a test event from the server CLI"
            }
        }
    ]
});

const options = {
    hostname: 'graph.facebook.com',
    path: `/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ SUCCESS: Event sent successfully!');
            console.log('Response:', JSON.parse(data));
        } else {
            console.error('❌ FAILED: Facebook returned an error.');
            console.error('Status:', res.statusCode);
            console.error('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ NETWORK ERROR: Could not connect to Facebook Graph API.');
    console.error(error);
});

req.write(payload);
req.end();
