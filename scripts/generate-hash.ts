// Quick script to generate bcrypt hash for a password
// Usage: npx tsx scripts/generate-hash.ts "your-password"

import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'admin123';

async function generateHash() {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n🔐 Bcrypt Hash Generated!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\n📋 SQL Insert Example:');
    console.log(`INSERT INTO admins (email, name, password_hash, role) VALUES`);
    console.log(`('admin@example.com', 'Admin User', '${hash}', 'super_admin');`);
    console.log('');
}

generateHash();
