import crypto from 'crypto';

const PIXEL_ID = process.env.FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

export async function sendFacebookEvent(eventName: string, userData: any, customData: any, eventId?: string) {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('Facebook Pixel ID or Access Token is missing. Event not sent.');
        return;
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Hash user data (SHA256)
    const hash = (value: string) => {
        if (!value) return null;
        return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
    };

    const payload = {
        data: [
            {
                event_name: eventName,
                event_time: currentTimestamp,
                event_id: eventId,
                action_source: "website",
                user_data: {
                    em: userData.email ? [hash(userData.email)] : [],
                    ph: userData.phone ? [hash(userData.phone)] : [],
                    fn: userData.firstName ? [hash(userData.firstName)] : [],
                    ln: userData.lastName ? [hash(userData.lastName)] : [],
                    client_ip_address: userData.ip,
                    client_user_agent: userData.userAgent,
                    fbc: userData.fbc,
                    fbp: userData.fbp
                },
                custom_data: customData
            }
        ]
    };

    try {
        const response = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Facebook CAPI Error:', data);
        } else {
            console.log('Facebook CAPI Success:', data);
        }
    } catch (error) {
        console.error('Failed to send Facebook event:', error);
    }
}
