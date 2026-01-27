
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚨 STARTING HARD RESET (DATA WIPE) 🚨');
    console.log('This will delete ALL data from the database.');

    // 1. Disable Foreign Key Checks to allow truncation in any order
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

    const tables = [
        'users',
        'tenants',
        'tenant_users',
        'subscriptions',
        'customers',
        'orders',
        'tasks',
        'interactions',
        'files',
        'tenant_audit_logs',
        'admin_activity_logs',
        'emailaccount',
        'emaillog',
        'emailthread',
        'emailthreadmember',
        'cachedemail',
        'emailattachment',
        'contact',
        'emailtemplate',
        'scheduledemail',
        // add any other tables
        'system_settings',
        'admins', // Legacy
        'platform_admins'
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
            console.log(`✅ Truncated ${table}`);
        } catch (e) {
            console.log(`⚠️  Could not truncate ${table} (might not exist), trying DELETE...`);
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\`;`);
                console.log(`✅ Deleted all from ${table}`);
            } catch (err) {
                console.error(`❌ Failed to clear ${table}:`, err);
            }
        }
    }

    // 2. Re-enable Foreign Key Checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('✨ HARD RESET COMPLETE ✨');
    console.log('Users, Companies, and Business Data are GONE.');
    console.log('Ready for new onboarding flow.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
