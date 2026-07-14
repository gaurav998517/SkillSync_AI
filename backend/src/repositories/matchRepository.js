const { prisma } = require('../config/database');

/**
 * MatchResult Repository
 * All database operations for the `match_results` table.
 * Match results are persisted after calculation to avoid recomputing costly embeddings.
 */

/**
 * Upsert a match result for a resume+job pair.
 * If a result already exists, it is updated with the latest score.
 * @param {object} data - { resumeId, jobId, score, matchedSkills, missingSkills }
 * @returns {Promise<MatchResult>}
 */
const upsert = async ({ resumeId, jobId, score, matchedSkills, missingSkills }) => {
    return prisma.matchResult.upsert({
        where: { resumeId_jobId: { resumeId, jobId } },
        create: { resumeId, jobId, score, matchedSkills, missingSkills },
        update: { score, matchedSkills, missingSkills },
    });
};

/**
 * Find a cached match result for a specific resume+job pair.
 * @param {string} resumeId
 * @param {string} jobId
 * @returns {Promise<MatchResult|null>}
 */
const findByResumeAndJob = async (resumeId, jobId) => {
    return prisma.matchResult.findUnique({
        where: { resumeId_jobId: { resumeId, jobId } },
    });
};

/**
 * Get all match results for a resume, ordered by score descending.
 * @param {string} resumeId
 * @returns {Promise<MatchResult[]>}
 */
const findByResume = async (resumeId) => {
    return prisma.matchResult.findMany({
        where: { resumeId },
        include: { job: true },
        orderBy: { score: 'desc' },
    });
};

/**
 * Delete all match results for a resume.
 * Called when a resume is deleted or re-uploaded.
 * @param {string} resumeId
 * @returns {Promise<{ count: number }>}
 */
const deleteByResume = async (resumeId) => {
    return prisma.matchResult.deleteMany({ where: { resumeId } });
};

module.exports = {
    upsert,
    findByResumeAndJob,
    findByResume,
    deleteByResume,
};
