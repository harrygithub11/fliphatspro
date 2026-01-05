export const DEFAULT_PAGE_CONTENT = {
    settings: {
        theme_color: 'red',
        dark_mode: true,
        show_timer: true,
        timer_end_date: ''
    },
    integrations: {
        google_analytics_id: '',
        facebook_pixel_id: '',
        custom_head_script: ''
    },
    cta_configuration: {
        primary_mode: 'razorpay_api',
        modes: {
            razorpay_api: { enabled: true, amount: 4999, success_url: '', button_text: 'Get Instant Access' },
            payment_link: { enabled: false, url: '', open_in_new_tab: true, button_text: 'Get Instant Access' },
            booking: { enabled: false, provider: 'calendly', url: '', button_text: 'Book a Strategy Call' },
            lead_form: { enabled: false, button_text: 'Get Instant Access' }
        }
    },
    hero: {
        announcement_badge: 'FLASH SALE LIVE',
        headline: 'Transform Your Career in 24 Hours',
        subheadline: 'The only course you need to launch your own profitable e-commerce brand from scratch. Professional guidance, complete setup, and a scalable system included.',
        video_type: 'hosted',
        video_src: '/Videos/marketing_hero_v1.mp4',
        thumbnail_src: '/Photos/Hero-Thumbnail.png',
        cta_text: 'Get Instant Access'
    },
    pricing: {
        sale_price: 4999,
        original_price: 12000,
        payment_link: '',
        title: 'Founder\'s Starter Plan',
        description: 'Perfect for validating your idea and launching your first store.',
        button_text: 'Get Instant Access',
        features: [
            "Complete e-commerce website",
            "Admin dashboard included",
            "Payment gateway integration",
            "Free hosting for 1st year",
            "Basic SEO setup",
            "Email automation setup"
        ]
    },
    features_config: {
        headline: 'Get more value from your tools',
        subheadline: 'Connect your tools, connect your teams. With everything included, your ecommerce journey is just a click away.'
    },
    problem_section: {
        enabled: true,
        title: 'Does This Sound Like You?',
        subtitle: 'Sounds familiar?',
        cards: [
            {
                title: "CHAOTIC SALES",
                heading: "Relying on Instagram, WhatsApp & random ads for sales?",
                text: "No real system. No control. Just juggling DMs, posts, and hoping today converts better than yesterday.",
                img: "/Photos/Overwhelmed entrepreneur amidst digital chaos.png"
            },
            {
                title: "SUBSCRIPTION FATIGUE",
                heading: "Tired of monthly platform fees eating your profit?",
                text: "Paying every month for your own store — and still feeling like you don’t really own it.",
                img: "/Photos/Facing financial stress and overdue bills.png"
            },
            {
                title: "LOCKED & LIMITED",
                heading: "Stuck with “upgrade required” and limited control?",
                text: "Want to customize, scale, or grow — but the platform keeps saying no unless you pay more.",
                img: "/Photos/Tech trouble and upgrade frustration.png"
            }
        ]
    },
    live_demos: {
        enabled: true,
        title: 'Experience the Power',
        description: 'Don\'t just take our word for it. Explore the live store and the powerful admin panel behind it.',
        items: [
            {
                title: "Live Demo Store",
                subtitle: "Customer Experience",
                desc: "See how your customers will browse and buy from your brand.",
                video: "/Videos/webpreview.mp4",
                link: "https://demo.fliphatmedia.com/",
                action: "Visit Store",
                icon: "ShoppingBag",
                color: "from-red-600/20 to-orange-600/20"
            },
            {
                title: "Admin Dashboard",
                subtitle: "Business Control",
                desc: "Control everything from products and orders to payments.",
                video: "/Videos/dashpreview.mp4",
                link: "https://demo.fliphatmedia.com/admin",
                action: "Try Admin Panel",
                icon: "LayoutDashboard",
                color: "from-red-600/20 to-orange-600/20"
            }
        ]
    },
    order_flow: {
        enabled: true,
        title: 'Experience the Seamless Buying Flow',
        subtitle: 'Your customers get a world-class shopping experience from product to payment.',
        items: [
            {
                title: "Browse Products",
                desc: "Your customers browse your beautiful store.",
                image: "/Photos/Orderflow01.png",
                icon: "ShoppingBag"
            },
            {
                title: "Add to Cart",
                desc: "Seamless one-click add to cart experience.",
                image: "/Photos/Orderflow02.png",
                icon: "ShoppingCart"
            },
            {
                title: "Checkout",
                desc: "Simple checkout page optimized for conversions.",
                image: "/Photos/Orderflow04.png",
                icon: "CreditCard"
            }
        ]
    },
    comparison_table: {
        enabled: true,
        badge: "Don't Get Trapped by Subscriptions",
        title: 'Compare & Save',
        subtitle: 'See exactly how much you save by switching to the founder-friendly model.',
        rows: [
            {
                name: "Setup Cost",
                fliphat: "One-time Payment",
                shopify: "Monthly Subscription",
                description: "Pay once and own your store forever vs renting it every month."
            },
            {
                name: "Monthly Fees",
                fliphat: "₹ 0 / month",
                shopify: "₹ 1,994 / month +",
                description: "Save ~₹24,000 every year in platform fees alone."
            },
            {
                name: "Transaction Fees",
                fliphat: "0% Commission",
                shopify: "2.0% per sale",
                description: "Keep 100% of your hard-earned revenue."
            }
        ]
    },
    setup_process: {
        enabled: true,
        badge: 'Fast Track',
        title: 'From Idea to Brand in 24 Hours',
        subtitle: 'We\'ve optimized the launch process. No drag-and-drop headaches. Just results.',
        items: [
            {
                step: "01",
                title: "Share Requirements",
                desc: "Fill a structured form with your product details, colors, and vision. Takes 5 mins.",
                icon: "ClipboardList",
            },
            {
                step: "02",
                title: "We Develop",
                desc: "Our pro team builds your store, sets up payments, and configures shipping.",
                icon: "Code2",
            },
            {
                step: "03",
                title: "Launch & Train",
                desc: "Handover in 24 hours. We give you a 1:1 training session to manage your empire.",
                icon: "Rocket",
            }
        ]
    },
    marquee: {
        enabled: true,
        text: 'FOUNDER KICKSTARTER OFFER • LIMITED TIME ONLY • LAUNCH IN 24 HOURS • '
    },
    features: [
        {
            title: "Your Own Website",
            description: "A professional, mobile-responsive e-commerce store with your own domain included.",
            icon: "Laptop"
        },
        {
            title: "User-Friendly Dashboard",
            description: "All your data in one place. Intuitive interface to view sales, inventory and customer insights.",
            icon: "BarChart"
        },
        {
            title: "Real-Time Insights",
            description: "Stay up to date with instant analytics. React quickly to trends and optimize your sales.",
            icon: "Zap"
        },
        {
            title: "Marketing Tools",
            description: "Email automation, discount codes, and abandoned cart recovery tools built right in.",
            icon: "Rocket"
        }
    ],
    testimonials: [
        {
            name: "Rajesh S.",
            role: "Founder, UrbanKicks Delhi",
            content: "I was paying ₹2000/month just for Shopify. With FliphatMedia, I paid once and now I own my store completely. The UPI integration is flawless for my customers.",
            location: "New Delhi",
            initials: "RS"
        },
        {
            name: "Priya Patel",
            role: "Owner, EthnicWeave",
            content: "My saree business needed a premium website. The team helped me setup everything in 24 hours. My sales have increased by 40% since launching.",
            location: "Ahmedabad",
            initials: "PP"
        },
        {
            name: "Amit Verma",
            role: "CEO, TechGadgets Hub",
            content: "The admin dashboard is actually better than what I used before. I can track my inventory and fulfill orders from my phone. Highly recommended.",
            location: "Mumbai",
            initials: "AV"
        },
        {
            name: "Sneha Reddy",
            role: "Co-founder, OrganicLife",
            content: "Finally a platform that understands Indian e-commerce. The shipping integration with Shiprocket was a lifesaver for our delivery process.",
            location: "Bangalore",
            initials: "SR"
        },
        {
            name: "Vikram Malhotra",
            role: "Director, VMFitness",
            content: "Zero monthly fees is a game changer. I used that extra money to run more ads. The site speed is blazing fast even with 500+ products.",
            location: "Gurgaon",
            initials: "VM"
        },
        {
            name: "Anjali Gupta",
            role: "Owner, DecorDreams",
            content: "I was skeptical about the 'one-time cost' but it's real. No hidden fees. The support team is very helpful and they speak Hindi too!",
            location: "Pune",
            initials: "AG"
        }
    ],
    faq: [
        {
            question: "Is this really a one-time payment?",
            answer: "Yes! Unlike Shopify or Wix, you don't pay us monthly platform fees. You own the code and the store. The only recurring cost after 1 year is standard hosting (approx ₹3k/year)."
        },
        {
            question: "Do I need technical knowledge?",
            answer: "Zero. We set up everything for you. You get a simple admin panel (like Amazon seller dashboard) to add products and view orders."
        },
        {
            question: "How long until I go live?",
            answer: "Once you share your product details and requirements, we guarantee your store will be ready for launch within 24 hours."
        }
    ]
};
