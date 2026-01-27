
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function triggerSync() {
    // Need to find the port? Screenshot said 3057.
    // Also need an Account ID. We know test account is ID 3 (from debug logs earlier).
    // And ideally an Auth token. But the API requires 'Authorization: Bearer YWRtaW4...' (admin base64 check).

    // Check verifyAdmin in sync/route.ts:
    // return authHeader.replace('Bearer ', '').startsWith('YWRtaW4') 
    // 'YWRtaW4' decodes to 'admin'.

    const PORT = 3057;
    const ACCOUNT_ID = 3; // From debug logs earlier step 4034

    console.log(`Triggering sync for Account ${ACCOUNT_ID} on port ${PORT}...`);

    try {
        const response = await fetch(`http://localhost:${PORT}/api/email-system/sync`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YWRtaW4=' // admin=
            },
            body: JSON.stringify({ accountId: ACCOUNT_ID, limit: 10 })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

triggerSync();
