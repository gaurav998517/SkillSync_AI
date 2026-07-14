/**
 * Jest Global Setup — runs ONCE before all test suites.
 * Applies Prisma migrations to the test database.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

module.exports = async () => {
    // Load environment variables
    const envPath = path.join(__dirname, '..', '..', '..', '.env');
    require('dotenv').config({ path: envPath });

    // Set DATABASE_URL to DATABASE_TEST_URL
    const testDbUrl = process.env.DATABASE_TEST_URL || process.env.DATABASE_URL;
    process.env.DATABASE_URL = testDbUrl;
    process.env.DIRECT_URL = testDbUrl;

    const envTmpPath = envPath + '.tmp';
    let envRenamed = false;

    console.log('\n[TEST SETUP] Applying Prisma migrations to test database...');
    try {
        // Temporarily rename .env so Prisma CLI doesn't load it and override process.env.DATABASE_URL
        if (fs.existsSync(envPath)) {
            fs.renameSync(envPath, envTmpPath);
            envRenamed = true;
        }

        execSync('npx prisma migrate deploy', {
            cwd: path.join(__dirname, '..', '..', '..'),
            env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl },
            stdio: 'pipe',
        });
        console.log('[TEST SETUP] Migrations applied successfully.');
    } catch (err) {
        console.error('[TEST SETUP] Migration failed:', err.stderr?.toString() || err.message);
        throw err;
    } finally {
        // Restore .env file
        if (envRenamed && fs.existsSync(envTmpPath)) {
            fs.renameSync(envTmpPath, envPath);
        }
    }
};
