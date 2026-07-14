const aiSuggestionRepository = require('../repositories/aiSuggestionRepository');

/**
 * Cache Service
 * Thin wrapper around aiSuggestionRepository for backwards compatibility.
 * Previously backed by Firestore — now backed by PostgreSQL JSONB.
 *
 * This maintains the same public API so aiController.js can use it without changes.
 */

const getCachedSuggestions = async (resumeId, jobId) => {
    return aiSuggestionRepository.getCached(resumeId, jobId);
};

const cacheSuggestions = async (resumeId, jobId, suggestions) => {
    return aiSuggestionRepository.upsert(resumeId, jobId, suggestions);
};

module.exports = { getCachedSuggestions, cacheSuggestions };
