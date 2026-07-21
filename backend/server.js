const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = require('./src/app');
const { prisma } = require('./src/config/database');
const { preloadModel } = require('./src/services/matchService');
const { deleteExpired } = require('./src/repositories/aiSuggestionRepository');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('[DATABASE] PostgreSQL connected via Prisma.');
    } catch (err) {
        console.error('[DATABASE] Failed to connect to PostgreSQL:', err.message);
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.warn('[DATABASE] Continuing server startup in development mode despite database error.');
        }
    }

    // 2. Evict stale AI suggestion cache entries from previous sessions
    deleteExpired().catch((err) =>
        console.warn('[CACHE] Failed to evict expired AI suggestions on startup:', err.message)
    );

    // 3. Preload and warm up NLP embedding model
    await preloadModel();

    // 4. Start Express server
    app.listen(PORT, () => {
        console.log(`[SERVER] SkillSync AI running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
    });
};

startServer().catch((err) => {
    console.error('[SERVER] Fatal startup error:', err);
    process.exit(1);
});
