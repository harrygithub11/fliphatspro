require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD ?? '',
            database: process.env.DB_NAME || 'newyearlp',
        });

        console.log("Creating landing_pages table...");

        await connection.execute(`
            CREATE TABLE IF NOT EXISTS landing_pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                content JSON,
                page_views INT DEFAULT 0,
                conversions INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_slug (slug)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log("Table landing_pages created successfully.");

        // Check if we need to insert a demo page
        const [rows] = await connection.execute('SELECT count(*) as count FROM landing_pages');
        if (rows[0].count === 0) {
            console.log("Seeding demo page...");
            const demoContent = {
                settings: {
                    theme_color: "red",
                    dark_mode: true,
                    show_timer: true,
                    timer_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                },
                integrations: {
                    google_analytics_id: "",
                    facebook_pixel_id: "",
                    custom_head_script: ""
                },
                cta_configuration: {
                    primary_mode: "razorpay_api",
                    modes: {
                        razorpay_api: { enabled: true, amount: 4999 },
                        payment_link: { enabled: false, url: "" },
                        booking: { enabled: false, url: "" }
                    }
                },
                hero: {
                    announcement_badge: "DEMO OFFER",
                    headline: "Dynamic Sales Page Demo",
                    subheadline: "This page is fully controlled from the admin dashboard.",
                    video_type: "hosted",
                    video_src: "/Videos/12k LP.mp4",
                    thumbnail_src: "/Photos/12k-video-cover.jpg",
                    cta_text: "Get It Now"
                },
                features: [],
                pricing: {
                    sale_price: 4999,
                    original_price: 12000,
                    discount_label: "60% OFF",
                    button_text: "Buy Now",
                    payment_link: ""
                },
                testimonials: [],
                faq: []
            };

            await connection.execute(
                'INSERT INTO landing_pages (slug, name, content) VALUES (?, ?, ?)',
                ['demo-sale', 'Demo Sales Page', JSON.stringify(demoContent)]
            );
            console.log("Demo page 'demo-sale' created.");
        }

        await connection.end();
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
