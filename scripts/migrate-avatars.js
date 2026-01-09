const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Try .env first (production), fallback to .env.local (local dev)
const envPath = fs.existsSync('.env') ? '.env' : '.env.local';
require('dotenv').config({ path: envPath });

async function migrateAvatars() {
    console.log('\n🔄 MIGRATING AVATAR FILES AND URLS\n');
    console.log('='.repeat(50));

    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'newyear',
            port: process.env.DB_PORT || 3306,
        });
        console.log('✅ Database connected');

        // Get all admins with avatar URLs
        const [admins] = await connection.execute(
            'SELECT id, name, avatar_url FROM admins WHERE avatar_url IS NOT NULL AND avatar_url != ""'
        );

        console.log(`\n📋 Found ${admins.length} admin(s) with avatars\n`);

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const avatarsDir = path.join(uploadsDir, 'avatars');

        // Ensure avatars directory exists
        if (!fs.existsSync(avatarsDir)) {
            fs.mkdirSync(avatarsDir, { recursive: true });
            console.log('✅ Created /public/uploads/avatars/\n');
        }

        let movedCount = 0;
        let updatedCount = 0;

        for (const admin of admins) {
            const oldUrl = admin.avatar_url;
            console.log(`Processing: ${admin.name} (${admin.id})`);
            console.log(`  Old URL: ${oldUrl}`);

            // Check if URL already has /avatars/ in it
            if (oldUrl.includes('/avatars/')) {
                console.log('  ✓ Already using correct path\n');
                continue;
            }

            // Extract filename from URL
            const filename = path.basename(oldUrl);
            const oldFilePath = path.join(uploadsDir, filename);
            const newFilePath = path.join(avatarsDir, filename);
            const newUrl = `/uploads/avatars/${filename}`;

            // Move file if it exists
            if (fs.existsSync(oldFilePath)) {
                fs.renameSync(oldFilePath, newFilePath);
                console.log(`  ✅ Moved file to /avatars/`);
                movedCount++;
            } else {
                console.log(`  ⚠️  File not found at old location`);
            }

            // Update database
            await connection.execute(
                'UPDATE admins SET avatar_url = ? WHERE id = ?',
                [newUrl, admin.id]
            );
            console.log(`  ✅ Updated database URL`);
            console.log(`  New URL: ${newUrl}\n`);
            updatedCount++;
        }

        console.log('='.repeat(50));
        console.log('\n📊 MIGRATION SUMMARY:');
        console.log(`   Files moved: ${movedCount}`);
        console.log(`   Database records updated: ${updatedCount}`);
        console.log('\n✅ Migration completed successfully!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrateAvatars();
