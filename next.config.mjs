/** @type {import('next').NextConfig} */
const nextConfig = {
    // output: 'standalone', // Disabled to support custom server.ts
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true,
    },
    // Rewrites to serve static backup HTML for marketing site
    async rewrites() {
        return {
            // These rewrites only apply when no file/folder matches
            fallback: [
                // Root domain serves the backup index.html
                {
                    source: '/',
                    destination: '/index-backup.html',
                    // This rewrite only applies for marketing (root domain)
                    // Subdomain routing is handled by middleware
                },
                {
                    source: '/pricing',
                    destination: '/pricing-backup.html',
                },
                {
                    source: '/auth',
                    destination: '/auth-backup.html',
                },
            ],
        };
    },
};

export default nextConfig;
