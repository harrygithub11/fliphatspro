'use client';

import { useEffect } from 'react';

export default function LoginRedirect() {
    useEffect(() => {
        const host = window.location.hostname;
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';

        // Simple domain extraction
        // If localhost, stick to localhost. Otherwise assume fliphats.com or derives from current
        let baseDomain = 'fliphats.com';
        if (host.includes('localhost')) {
            baseDomain = 'localhost';
        } else if (host.endsWith('fliphats.com')) {
            baseDomain = 'fliphats.com';
        }

        // Redirect to account subdomain
        const accountUrl = `${protocol}//account.${baseDomain}${port}/login`;
        window.location.href = accountUrl;
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Redirecting to secure login...</p>
            </div>
        </div>
    );
}
