#!/usr/bin/env npx tsx
/**
 * Multi-Tenant Migration Runner
 * 
 * Executes the multi-tenant migration scripts in order.
 * 
 * Usage:
 *   npx tsx scripts/run-multi-tenant-migration.ts
 * 
 * Options:
 *   --dry-run    Show what would be executed without making changes
 *   --step=N     Run only step N (1, 2, or 3)
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'newyear',
    multipleStatements: true,
};

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations', 'multi-tenant');

const MIGRATION_FILES = [
    '001_create_tenant_tables.sql',
    '002_add_tenant_id_columns.sql',
    '003_migrate_existing_data.sql',
];

async function runMigration(connection: mysql.Connection, filename: string, dryRun: boolean) {
    const filepath = path.join(MIGRATIONS_DIR, filename);

    if (!fs.existsSync(filepath)) {
        console.error(`❌ Migration file not found: ${filename}`);
        return false;
    }

    const sql = fs.readFileSync(filepath, 'utf-8');

    console.log(`\n📄 ${filename}`);
    console.log('─'.repeat(50));

    if (dryRun) {
        console.log('   [DRY RUN] Would execute:');
        console.log(`   ${sql.substring(0, 200)}...`);
        return true;
    }

    try {
        const startTime = Date.now();
        await connection.query(sql);
        const duration = Date.now() - startTime;

        console.log(`   ✅ Completed in ${duration}ms`);
        return true;
    } catch (error: any) {
        console.error(`   ❌ Failed: ${error.message}`);

        // Check for specific errors that might be okay
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('   ℹ️  Table already exists (skipping)');
            return true;
        }
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   ℹ️  Column already exists (skipping)');
            return true;
        }

        return false;
    }
}

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const stepArg = args.find(a => a.startsWith('--step='));
    const specificStep = stepArg ? parseInt(stepArg.split('=')[1]) : null;

    console.log('\n🚀 Multi-Tenant Migration Runner');
    console.log('═'.repeat(50));

    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    console.log('Database:', dbConfig.database);
    console.log('Host:', dbConfig.host);

    let connection: mysql.Connection | null = null;

    try {
        console.log('\n📡 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('   ✅ Connected\n');

        // Determine which migrations to run
        const migrationsToRun = specificStep
            ? [MIGRATION_FILES[specificStep - 1]]
            : MIGRATION_FILES;

        console.log(`📋 Migrations to run: ${migrationsToRun.length}`);

        let allSuccessful = true;

        for (const filename of migrationsToRun) {
            const success = await runMigration(connection, filename, dryRun);
            if (!success) {
                allSuccessful = false;
                console.log('\n⛔ Migration failed. Stopping execution.');
                break;
            }
        }

        if (allSuccessful) {
            console.log('\n' + '═'.repeat(50));
            console.log('✅ All migrations completed successfully!');

            if (!dryRun) {
                console.log('\n📋 Next Steps:');
                console.log('   1. Regenerate Prisma client: npx prisma generate');
                console.log('   2. Restart the development server: npm run dev');
                console.log('   3. Test the tenant selector at /admin/select-tenant');
            }
        }

    } catch (error: any) {
        console.error('\n❌ Migration error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n📡 Database connection closed');
        }
    }
}

main().catch(console.error);
