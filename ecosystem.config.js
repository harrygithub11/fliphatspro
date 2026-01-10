module.exports = {
    apps: [
        {
            name: 'newyearlp-web',
            script: 'npm',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        },
        {
            name: 'newyearlp-worker',
            script: 'npx',
            args: 'ts-node --project tsconfig.worker.json workers/email-worker.ts',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G'
        },
        {
            name: 'newyearlp-imap',
            script: 'npx',
            args: 'ts-node --project tsconfig.worker.json workers/imap-sync.ts',
            instances: 1,
            autorestart: true,
            watch: false,
            cron_restart: "*/5 * * * *", // Restart every 5 mins to sync (or loop internally)
            max_memory_restart: '1G'
        }
    ]
};
