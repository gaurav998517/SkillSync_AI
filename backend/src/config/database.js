const { PrismaClient } = require('@prisma/client');

// Sanitize database connection environment variables (e.g. remove leading/trailing quotes pasted by mistake)
if (process.env.DATABASE_URL) {
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/^["']|["']$/g, '');
}
if (process.env.DIRECT_URL) {
    process.env.DIRECT_URL = process.env.DIRECT_URL.replace(/^["']|["']$/g, '');
}

/**
 * Prisma Client Singleton
 *
 * In development, module hot-reloading (nodemon) can create multiple PrismaClient
 * instances, exhausting the PostgreSQL connection pool. We prevent this by caching
 * the instance on `global` in non-production environments.
 *
 * In production, a fresh instance is always created (no module caching issues).
 */

let prisma;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient({
        log: ['error', 'warn'],
    });
} else {
    // Reuse cached instance in dev/test to avoid connection pool exhaustion
    if (!global.__prisma) {
        global.__prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'test' ? ['error'] : ['query', 'error', 'warn'],
        });
    }
    prisma = global.__prisma;
}

/**
 * Gracefully disconnect Prisma on process termination.
 * This prevents dangling connections in containerized environments.
 */
const gracefulDisconnect = async () => {
    await prisma.$disconnect();
    console.log('[DATABASE] Prisma disconnected gracefully.');
};

process.on('SIGINT', gracefulDisconnect);
process.on('SIGTERM', gracefulDisconnect);

module.exports = { prisma };
