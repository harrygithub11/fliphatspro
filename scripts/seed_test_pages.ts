
import pool from '../lib/db';

async function main() {
    try {
        const [tenants]: any = await pool.execute('SELECT id, name FROM tenants WHERE slug = ?', ['Tcompany01']);

        if (tenants.length === 0) {
            console.log('Tenant Tcompany01 not found');
            return;
        }

        const tenantId = tenants[0].id;
        console.log(`Found tenant: ${tenants[0].name} (${tenantId})`);

        const pages = [
            {
                name: 'New Year Offer 5k',
                slug: 'new-year-offer-5k',
                content: {
                    hero: {
                        headline: 'Launch Your Brand with Our Exclusive New Year Deal',
                        subheadline: 'Get your full e-commerce store set up for just ₹5,000.',
                        cta_text: 'Claim Offer Now'
                    },
                    pricing: {
                        sale_price: 5000,
                        original_price: 15000
                    }
                }
            },
            {
                name: 'Flash Sale - Premium Setup',
                slug: 'flash-sale-premium',
                content: {
                    hero: {
                        headline: 'Premium Store Setup - Flash Sale',
                        subheadline: 'Limited time offer for high-converting stores.',
                        cta_text: 'Get Started'
                    }
                }
            }
        ];

        for (const page of pages) {
            const [existing]: any = await pool.execute(
                'SELECT id FROM landing_pages WHERE slug = ? AND tenant_id = ?',
                [page.slug, tenantId]
            );

            if (existing.length === 0) {
                await pool.execute(
                    'INSERT INTO landing_pages (tenant_id, name, slug, content, is_active) VALUES (?, ?, ?, ?, true)',
                    [tenantId, page.name, page.slug, JSON.stringify(page.content)]
                );
                console.log(`Created page: ${page.name}`);
            } else {
                console.log(`Page already exists: ${page.name}`);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

main();
