const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log('Finding latest task...');
    const tasks = await prisma.task.findMany({ orderBy: { id: 'desc' }, take: 1 });

    if (tasks.length > 0) {
        const taskId = tasks[0].id;
        const link = `/workspace?taskId=${taskId}`;
        const data = JSON.stringify({ taskId });

        console.log(`Updating all notifications to point to WORKSPACE with task #${taskId}...`);
        await prisma.$executeRawUnsafe(
            `UPDATE notifications SET link = ?, data = ?`,
            link, data
        );
        console.log('Done! All notifications now link to /workspace?taskId=' + taskId);
    } else {
        console.log('No tasks found in the database.');
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
