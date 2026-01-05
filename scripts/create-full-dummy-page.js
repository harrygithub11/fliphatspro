const mysql = require('mysql2/promise');
require('dotenv').config();

const content = {
    settings: {
        theme_color: 'red',
        dark_mode: true,
        show_timer: true,
        timer_end_date: '2026-02-01T23:59:00'
    },
    integrations: {
        google_analytics_id: 'G-DUMMY123456',
        facebook_pixel_id: 'PIXEL-987654321',
        custom_head_script: ''
    },
    cta_configuration: {
        primary_mode: 'lead_form',
        modes: {
            razorpay_api: { enabled: true, amount: 499900, success_url: '' },
            payment_link: { enabled: false, url: '', open_in_new_tab: true },
            booking: { enabled: false, provider: 'calendly', url: '', button_text: 'Book Strategy' },
            lead_form: { enabled: true, button_text: 'Claim Early Access' }
        }
    },
    hero: {
        announcement_badge: 'BETA ACCESS OPEN',
        headline: 'The Ultimate AI-Powered Launch System',
        subheadline: 'Stop struggling with code. Build, Launch, and Scale your e-commerce empire in less than 24 hours with our automated engine.',
        video_type: 'hosted',
        video_src: '/Videos/5k LP.mp4',
        thumbnail_src: '/Photos/5k-video-cover.jpg',
        cta_text: 'Claim Early Access'
    },
    pricing: {
        sale_price: 4999,
        original_price: 24999,
        payment_link: '',
        title: 'Founder\'s Deal'
    },
    features: [
        { title: 'AI Copywriter', description: 'Generate high-converting sales copy in seconds.', icon: 'Type' },
        { title: 'One-Click Deploy', description: 'Push your store to live servers instantly.', icon: 'Rocket' },
        { title: 'Smart Analytics', description: 'Track every visitor, click, and sale in real-time.', icon: 'BarChart' },
        { title: 'Automated SEO', description: 'Rank higher on Google without lifting a finger.', icon: 'Search' }
    ],
    testimonials: [
        { name: 'Rahul Sharma', role: 'D2C Founder', content: 'This tool saved me months of development time. Highly recommended!', avatar_url: '' },
        { name: 'Priya Patel', role: 'Marketing Head', content: 'The conversion rates on these pages are insane. 3X ROAS on day one.', avatar_url: '' }
    ],
    faq: [
        { question: 'Is coding knowledge required?', answer: 'Absolutely not. Our visual builder handles everything.' },
        { question: 'Can I use my own domain?', answer: 'Yes, custom domain support is included in the Pro plan.' },
        { question: 'What is the refund policy?', answer: 'We offer a 30-day no-questions-asked money-back guarantee.' }
    ]
};

async function createDummyPage() {
    console.log('Connecting to database...');
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const slug = 'ai-launch-2026';
        const name = 'AI Launch System (Dummy)';

        // Check if exists
        const [existing] = await connection.execute('SELECT id FROM landing_pages WHERE slug = ?', [slug]);

        if (existing.length > 0) {
            console.log(`Page with slug /${slug} already exists. Updating...`);
            await connection.execute(
                'UPDATE landing_pages SET content = ?, name = ?, is_active = 1, updated_at = NOW() WHERE slug = ?',
                [JSON.stringify(content), name, slug]
            );
        } else {
            console.log(`Creating new page /${slug}...`);
            await connection.execute(
                'INSERT INTO landing_pages (slug, name, is_active, content) VALUES (?, ?, 1, ?)',
                [slug, name, JSON.stringify(content)]
            );
        }

        console.log('✅ Dummy Page Created Successfully!');
        console.log(`> URL: /sale/${slug}`);
    } catch (error) {
        console.error('Error creating page:', error);
    } finally {
        await connection.end();
    }
}

createDummyPage();
