/**
 * Jest Global Teardown — runs ONCE after all test suites.
 * Cleans up the test database and disconnects Prisma.
 */
const { PrismaClient } = require('@prisma/client');

const path = require('path');

module.exports = async () => {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
    
    // Set test URL
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL || process.env.DATABASE_URL;

    const prisma = new PrismaClient();
    try {
        // Truncate all tables in reverse FK order
        await prisma.$executeRawUnsafe('TRUNCATE TABLE audit_logs, sessions, ai_suggestions, match_results, saved_jobs, resumes, jobs, users RESTART IDENTITY CASCADE;');
        console.log('\n[TEST TEARDOWN] Test database cleaned up.');
    } catch (err) {
        console.warn('[TEST TEARDOWN] Cleanup warning:', err.message);
    } finally {
        await prisma.$disconnect();
    }
};
