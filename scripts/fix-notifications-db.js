const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking notifications table structure...');
        const columns = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM notifications`);
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('link')) {
            console.log('Adding "link" column...');
            await prisma.$executeRawUnsafe(`ALTER TABLE notifications ADD COLUMN link TEXT DEFAULT NULL AFTER is_read`);
        } else {
            console.log('"link" column already exists.');
        }

        if (!columnNames.includes('data')) {
            console.log('Adding "data" column...');
            await prisma.$executeRawUnsafe(`ALTER TABLE notifications ADD COLUMN data JSON DEFAULT NULL AFTER link`);
        } else {
            console.log('"data" column already exists.');
        }

        console.log('Successfully updated notifications table.');
    } catch (error) {
        console.error('Error updating table:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
