const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function diagnose() {
    console.log('\n🔍 AVATAR SYSTEM DIAGNOSTIC\n');
    console.log('='.repeat(50));

    let connection;
    try {
        // 1. Check database connection
        console.log('\n1️⃣ Testing database connection...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'newyear',
            port: process.env.DB_PORT || 3306,
        });
        console.log('✅ Database connected');

        // 2. Check if avatar_url column exists
        console.log('\n2️⃣ Checking if avatar_url column exists...');
        const [columns] = await connection.execute('DESCRIBE admins');
        const avatarColumn = columns.find(col => col.Field === 'avatar_url');

        if (avatarColumn) {
            console.log('✅ avatar_url column exists');
            console.log(`   Type: ${avatarColumn.Type}`);
            console.log(`   Null: ${avatarColumn.Null}`);
        } else {
            console.log('❌ avatar_url column MISSING!');
            console.log('   Run: node scripts/migrate-profile.js');
            process.exit(1);
        }

        // 3. Check current avatar values
        console.log('\n3️⃣ Checking current avatar values...');
        const [admins] = await connection.execute('SELECT id, name, email, avatar_url FROM admins');

        if (admins.length === 0) {
            console.log('⚠️  No admin users found');
        } else {
            console.log(`Found ${admins.length} admin(s):`);
            admins.forEach(admin => {
                console.log(`   ${admin.id}. ${admin.name} (${admin.email})`);
                console.log(`      avatar_url: ${admin.avatar_url || 'NULL'}`);
            });
        }

        // 4. Check uploads directory
        console.log('\n4️⃣ Checking uploads directory...');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        const avatarsDir = path.join(uploadsDir, 'avatars');

        if (!fs.existsSync(uploadsDir)) {
            console.log('⚠️  /public/uploads does not exist');
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('✅ Created /public/uploads');
        } else {
            console.log('✅ /public/uploads exists');
        }

        if (!fs.existsSync(avatarsDir)) {
            console.log('⚠️  /public/uploads/avatars does not exist');
            fs.mkdirSync(avatarsDir, { recursive: true });
            console.log('✅ Created /public/uploads/avatars');
        } else {
            console.log('✅ /public/uploads/avatars exists');
            const files = fs.readdirSync(avatarsDir);
            console.log(`   Contains ${files.length} file(s)`);
            if (files.length > 0) {
                console.log('   Files:', files.slice(0, 5).join(', '));
            }
        }

        // 5. Summary
        console.log('\n' + '='.repeat(50));
        console.log('\n📊 SUMMARY:\n');
        console.log('✅ All checks passed!');
        console.log('\nNext steps:');
        console.log('1. Upload a new avatar via the UI');
        console.log('2. Check browser Network tab (F12) to see:');
        console.log('   - POST /api/admin/profile/avatar (should return success)');
        console.log('   - The returned URL should have ?t=timestamp');
        console.log('3. If upload succeeds but UI doesn\'t update:');
        console.log('   - Clear browser cache (Ctrl+Shift+Delete)');
        console.log('   - Hard refresh (Ctrl+Shift+R)');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

diagnose();
