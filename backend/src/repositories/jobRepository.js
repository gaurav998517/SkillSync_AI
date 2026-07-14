const { prisma } = require('../config/database');

/**
 * Job Repository
 * All database operations for the `jobs` table.
 */

/**
 * Create a new job posting.
 * @param {object} jobData - { title, company, requiredSkills, minExperience, description }
 * @returns {Promise<Job>}
 */
const create = async ({ title, company, requiredSkills = [], minExperience = 0, description = '' }) => {
    const normalizedSkills = [...new Set(
        requiredSkills
            .map((s) => (s ? s.toString().toLowerCase().trim() : ''))
            .filter(Boolean)
    )];

    // Ensure minExperience is a valid integer, defaulting to 0 if null, NaN, or undefined
    const parsedExperience = parseInt(minExperience, 10);
    const finalExperience = isNaN(parsedExperience) ? 0 : parsedExperience;

    return prisma.job.create({
        data: {
            title,
            company,
            requiredSkills: normalizedSkills,
            minExperience: finalExperience,
            description,
        },
    });
};

/**
 * Find a job by UUID.
 * @param {string} id
 * @returns {Promise<Job|null>}
 */
const findById = async (id) => {
    return prisma.job.findFirst({
        where: { id, isActive: true },
    });
};

/**
 * Get all active jobs, ordered by newest first.
 * @returns {Promise<Job[]>}
 */
const findAll = async () => {
    return prisma.job.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Update a job's fields.
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<Job>}
 */
const update = async (id, updateData) => {
    return prisma.job.update({
        where: { id },
        data: updateData,
    });
};

/**
 * Soft-delete a job (sets isActive = false).
 * Preserves historical match_results and saved_jobs records.
 * @param {string} id
 * @returns {Promise<Job>}
 */
const softDelete = async (id) => {
    return prisma.job.update({
        where: { id },
        data: { isActive: false },
    });
};

/**
 * Create multiple jobs in a single transaction (for seed operations).
 * @param {object[]} jobsArray
 * @returns {Promise<{ count: number }>}
 */
const createMany = async (jobsArray) => {
    const data = jobsArray.map(({ title, company, requiredSkills = [], minExperience = 0, description = '' }) => {
        const parsedExperience = parseInt(minExperience, 10);
        const finalExperience = isNaN(parsedExperience) ? 0 : parsedExperience;
        return {
            title,
            company,
            requiredSkills: [...new Set(requiredSkills.map((s) => s.toLowerCase().trim()).filter(Boolean))],
            minExperience: finalExperience,
            description,
        };
    });

    return prisma.job.createMany({ data, skipDuplicates: true });
};

module.exports = {
    create,
    findById,
    findAll,
    update,
    softDelete,
    createMany,
};
