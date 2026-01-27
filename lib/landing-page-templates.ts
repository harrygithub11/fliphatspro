
import { DEFAULT_PAGE_CONTENT } from './constants';
import { deepMerge } from './utils';

export interface LandingPageTemplate {
    id: string;
    name: string;
    description: string;
    category: 'funnel' | 'ecommerce' | 'lead-gen' | 'event' | 'saas';
    badge?: string;
    content: typeof DEFAULT_PAGE_CONTENT;
}

export const LANDING_PAGE_TEMPLATES: LandingPageTemplate[] = [
    {
        id: 'classic-funnel',
        name: 'Classic Course Funnel',
        description: 'A proven high-converting structure for courses and info-products. Uses the "Problem-Agitate-Solve" framework.',
        category: 'funnel',
        badge: 'Best Seller',
        content: deepMerge(DEFAULT_PAGE_CONTENT, {
            hero: {
                headline: 'Master [Skill Name] in Just 30 Days',
                subheadline: 'Stop struggling with [Pain Point]. Join 5,000+ students who have transformed their careers with this comprehensive system.',
                cta_text: 'Start Learning Now',
                announcement_badge: 'NEW COHORT OPENING'
            },
            problem_section: {
                enabled: true,
                title: 'Is [Problem] Holding You Back?',
                subtitle: 'THE STRUGGLE IS REAL',
                cards: [
                    { title: 'STUCK & FRUSTRATED', heading: 'Feeling like you\'re spinning your wheels?', text: 'You try to learn on your own, but information overload leaves you confused and overwhelmed.', img: '' },
                    { title: 'WASTING TIME', heading: 'Spending hours with zero results?', text: 'Tutorial hell is real. You watch videos but can\'t build anything real.', img: '' },
                    { title: 'MISSED OPPORTUNITIES', heading: 'Watching others succeed while you stay stuck?', text: 'The market is moving fast. Don\'t let another year go by without mastering this skill.', img: '' }
                ]
            },
            features: [
                { title: 'Step-by-Step Curriculum', description: 'Zero guesswork. Follow our proven roadmap from beginner to pro.', icon: 'Map' },
                { title: 'Community Support', description: 'Never get stuck again. Get answers in minutes from our active community.', icon: 'Users' },
                { title: 'Real-World Projects', description: 'Build a portfolio that gets you hired, not just toy apps.', icon: 'Briefcase' },
                { title: 'Lifetime Access', description: 'Pay once, own it forever. Free updates included.', icon: 'Infinity' }
            ],
            pricing: {
                title: 'Complete Course Bundle',
                description: 'Everything you need to master [Skill]',
                sale_price: 99,
                original_price: 299,
                button_text: 'Enroll Now & Save $200',
                features: ['30+ Hours of Video', 'Source Code Included', 'Certificate of Completion', 'Private Discord Access']
            },
            faq: [
                { question: 'Is this suitable for beginners?', answer: 'Absolutely. We start from scratch and build up to advanced concepts.' },
                { question: 'How long do I have access?', answer: 'Forever! You get lifetime access to all future updates.' },
                { question: 'Is there a refund policy?', answer: 'Yes, 30-day money-back guarantee. No questions asked.' }
            ]
        })
    },
    {
        id: 'direct-sale',
        name: 'Viral Physical Product',
        description: 'High-impact layout designed for trending physical products. Focuses on visuals, features, and scarcity.',
        category: 'ecommerce',
        badge: 'High Conversion',
        content: deepMerge(DEFAULT_PAGE_CONTENT, {
            hero: {
                headline: 'The Last [Product Category] You\'ll Ever Need',
                subheadline: 'Experience the difference with [Product Name]. Engineered for performance, designed for style.',
                cta_text: 'Order Now - 50% OFF',
                announcement_badge: 'OVER 10,000 SOLD'
            },
            problem_section: { enabled: false },
            features: [
                { title: 'Military Grade Durability', description: 'Built to withstand anything life throws at it.', icon: 'Shield' },
                { title: 'Eco-Friendly Materials', description: '100% sustainable and recyclable. Good for you, good for the planet.', icon: 'Leaf' },
                { title: 'Ergonomic Design', description: 'Fits perfectly in your hand/life. You\'ll forget it\'s even there.', icon: 'Sparkles' },
                { title: '2-Year Warranty', description: 'We stand by our quality. If it breaks, we replace it.', icon: 'CheckCircle' }
            ],
            pricing: {
                title: 'Limited Time Launch Offer',
                description: 'Get yours before we run out of stock again.',
                sale_price: 4999,
                original_price: 9999,
                button_text: 'Buy Now - Free Shipping',
                features: ['Free Express Shipping', '30-Day Risk Free Trial', 'Premium Gift Packaging', '24/7 Priority Support']
            },
            marquee: { enabled: true, text: 'FREE SHIPPING WORLDWIDE • 30-DAY MONEY BACK GUARANTEE • 2-YEAR WARRANTY • ' },
            cta_configuration: {
                primary_mode: 'razorpay_api',
                modes: { razorpay_api: { amount: 499900, button_text: 'Buy Now - ₹4,999' } }
            }
        })
    },
    {
        id: 'lead-magnet',
        name: 'High-Value Lead Magnet',
        description: 'Simple, focused page designed to capture emails in exchange for a free resource (PDF, Checklist, etc.).',
        category: 'lead-gen',
        content: deepMerge(DEFAULT_PAGE_CONTENT, {
            hero: {
                headline: 'Free Ultimate Guide to [Topic]',
                subheadline: 'Stop guessing. Get the exact blueprint I used to scale to [Result] in record time. Instant PDF Download.',
                cta_text: 'Send Me The Guide',
                announcement_badge: 'FREE DOWNLOAD'
            },
            problem_section: { enabled: false },
            pricing: {
                title: 'What You\'ll Learn Inside',
                description: 'This free guide covers crucial strategies:',
                sale_price: 0,
                original_price: 97,
                button_text: 'Download For Free',
                features: ['The 3-Step Scaling Framework', 'My "Secret Weapon" Tool Stack', 'Copy-Paste Email Templates', 'Checklist for Daily Success']
            },
            cta_configuration: {
                primary_mode: 'lead_form',
                modes: { lead_form: { button_text: 'Get Instant Access' } }
            },
            testimonials: [
                { name: 'Sarah J.', role: 'Marketing Manager', content: 'This guide is better than paid courses I\'ve taken. A total game changer.', location: 'New York', initials: 'SJ' },
                { name: 'Mike T.', role: 'Agency Owner', content: 'Implemented strategy #2 and saw results specifically in 24 hours. Crazy value.', location: 'London', initials: 'MT' }
            ]
        })
    },
    {
        id: 'webinar-event',
        name: 'Live Webinar Registration',
        description: 'Create urgency and excitement for your live event. Features specific sections for dates, speakers, and bonuses.',
        category: 'event',
        content: deepMerge(DEFAULT_PAGE_CONTENT, {
            settings: { show_timer: true },
            hero: {
                headline: 'LIVE MASTERCLASS: How to [Result] Without [Pain]',
                subheadline: 'Join us for this exclusive live training where we reveal the new method for 2026. Limited spots available.',
                cta_text: 'Save My Spot',
                announcement_badge: 'STARTING SOON'
            },
            features: [
                { title: 'The "New Way" Explained', description: 'Why the old methods are dead and what to do instead.', icon: 'Zap' },
                { title: 'Live Q&A Session', description: 'Get your specific questions answered directly by the experts.', icon: 'Mic' },
                { title: 'Exclusive Bonuses', description: 'Attendees get $500 worth of templates just for showing up.', icon: 'Gift' }
            ],
            cta_configuration: {
                primary_mode: 'lead_form',
                modes: { lead_form: { button_text: 'Register for Free' } }
            },
            pricing: {
                title: 'This Training Is Free For A Limited Time',
                description: 'Normally $197. Reserve your seat now.',
                sale_price: 0,
                original_price: 197,
                button_text: 'Register Now',
                features: ['90 Minutes of Pure Value', 'Live Q&A Access', 'Replay Recording', 'Workbook Included']
            },
            marquee: { enabled: true, text: '• LIVE TRAINING • SEATS FILLING FAST • EXCLUSIVE CONTENT • ' }
        })
    },
    {
        id: 'saas-launch',
        name: 'SaaS / Software Launch',
        description: 'Modern, clean aesthetic for software products. Highlights features, screenshots, and comparison tables.',
        category: 'saas',
        badge: 'Modern',
        content: deepMerge(DEFAULT_PAGE_CONTENT, {
            hero: {
                headline: 'The All-in-One Platform for [Target Audience]',
                subheadline: 'Manage your [Task], automate your [Work], and scale faster. No credit card required.',
                cta_text: 'Start Free Trial',
                announcement_badge: 'V2.0 NOW LIVE'
            },
            comparison_table: {
                enabled: true,
                title: 'Why Pros Switch to Us',
                badge: 'UNBEATABLE VALUE',
                rows: [
                    { name: 'Cost', fliphat: '$29/mo', shopify: '$299/mo', description: 'Fair pricing that scales with you.' },
                    { name: 'Setup Time', fliphat: '5 Minutes', shopify: '2 Weeks', description: 'Get up and running instantly.' },
                    { name: 'Support', fliphat: '24/7 Live Chat', shopify: 'Email Only', description: 'We are here when you need us.' }
                ]
            },
            features: [
                { title: 'Real-Time Analytics', description: 'Make data-driven decisions with our advanced dashboard.', icon: 'BarChart' },
                { title: 'Team Collaboration', description: 'Built for teams. Roles, permissions, and activity logs included.', icon: 'Users' },
                { title: '1-Click Integrations', description: 'Connect with Slack, Zoom, unique CRM, and 50+ other tools.', icon: 'Layers' },
                { title: 'Bank-Grade Security', description: 'SOC2 Compliant. Your data is safe with us.', icon: 'Lock' }
            ],
            pricing: {
                title: 'Simple, Transparent Pricing',
                description: 'Start free, upgrade as you grow.',
                sale_price: 29,
                original_price: 49,
                button_text: 'Start 14-Day Free Trial',
                features: ['Unlimited Projects', '5 Team Members', 'Priority Support', 'API Access']
            },
            cta_configuration: {
                primary_mode: 'booking',
                modes: { booking: { button_text: 'Book a Demo' } }
            }
        })
    }
];
