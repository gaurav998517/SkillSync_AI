const { prisma } = require('../config/database');

/**
 * AiSuggestion Repository
 * All database operations for the `ai_suggestions` table.
 * Replaces the Firestore `aiSuggestions` collection used by cacheService.js.
 * Suggestions are stored as JSONB with a TTL-based expiry timestamp.
 */

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Retrieve cached AI suggestions if they exist and are not expired.
 * @param {string} resumeId
 * @param {string} jobId
 * @returns {Promise<object|null>} Suggestions JSON object or null on cache miss/expiry
 */
const getCached = async (resumeId, jobId) => {
    const record = await prisma.aiSuggestion.findUnique({
        where: { resumeId_jobId: { resumeId, jobId } },
    });

    if (!record) return null;

    // Check if expired
    if (record.expiresAt < new Date()) {
        console.log(`[AiSuggestionRepo] Cache expired for resumeId:${resumeId}, jobId:${jobId}. Evicting...`);
        // Non-blocking delete of expired entry
        prisma.aiSuggestion
            .delete({ where: { resumeId_jobId: { resumeId, jobId } } })
            .catch((err) => console.error('[AiSuggestionRepo] Failed to evict expired cache:', err));
        return null;
    }

    console.log(`[AiSuggestionRepo] Cache HIT for resumeId:${resumeId}, jobId:${jobId}`);
    return record.suggestions;
};

/**
 * Store or update AI suggestions for a resume+job pair.
 * Uses upsert so that calling this is always idempotent.
 * @param {string} resumeId
 * @param {string} jobId
 * @param {object} suggestions - Structured AI response to store as JSONB
 * @returns {Promise<AiSuggestion>}
 */
const upsert = async (resumeId, jobId, suggestions) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_DURATION_MS);

    return prisma.aiSuggestion.upsert({
        where: { resumeId_jobId: { resumeId, jobId } },
        create: { resumeId, jobId, suggestions, expiresAt },
        update: { suggestions, expiresAt },
    });
};

/**
 * Delete all expired suggestion cache entries.
 * Should be run periodically (e.g. as a scheduled job or on server startup).
 * @returns {Promise<{ count: number }>}
 */
const deleteExpired = async () => {
    const result = await prisma.aiSuggestion.deleteMany({
        where: { expiresAt: { lt: new Date() } },
    });
    console.log(`[AiSuggestionRepo] Evicted ${result.count} expired cache entries.`);
    return result;
};

module.exports = {
    getCached,
    upsert,
    deleteExpired,
};
