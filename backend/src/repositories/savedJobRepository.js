const { prisma } = require('../config/database');

/**
 * SavedJob Repository
 * All database operations for the `saved_jobs` join table.
 * Replaces the `savedJobs[]` array that was embedded on the Firestore User document.
 */

/**
 * Save a job for a user.
 * Throws a Prisma P2002 (unique constraint) error if already saved — caller should handle.
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<SavedJob>}
 */
const save = async (userId, jobId) => {
    return prisma.savedJob.create({
        data: { userId, jobId },
    });
};

/**
 * Remove a saved job for a user.
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<SavedJob>}
 */
const remove = async (userId, jobId) => {
    return prisma.savedJob.delete({
        where: {
            userId_jobId: { userId, jobId },
        },
    });
};

/**
 * Check if a job is already saved by a user.
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
const existsByUserAndJob = async (userId, jobId) => {
    const record = await prisma.savedJob.findUnique({
        where: {
            userId_jobId: { userId, jobId },
        },
    });
    return !!record;
};

/**
 * Get all jobs saved by a user, with full job details.
 * @param {string} userId
 * @returns {Promise<Job[]>} Array of job objects (not SavedJob wrappers)
 */
const findAllByUserId = async (userId) => {
    const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        include: { job: true },
        orderBy: { savedAt: 'desc' },
    });
    return savedJobs.map((sj) => sj.job);
};

module.exports = {
    save,
    remove,
    existsByUserAndJob,
    findAllByUserId,
};
