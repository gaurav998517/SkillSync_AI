const { prisma } = require('../config/database');

/**
 * Resume Repository
 * All database operations for the `resumes` table.
 */

/**
 * Create a new resume record.
 * @param {object} resumeData - { userId, filename, filepath, rawText, skills, education }
 * @returns {Promise<Resume>}
 */
const create = async ({ userId, filename, filepath, rawText, skills = [], education = [] }) => {
    return prisma.resume.create({
        data: {
            userId,
            filename,
            filepath,
            rawText,
            skills: skills.map((s) => s.toLowerCase().trim()),
            education,
        },
    });
};

/**
 * Find a resume by UUID.
 * @param {string} id
 * @returns {Promise<Resume|null>}
 */
const findById = async (id) => {
    return prisma.resume.findUnique({
        where: { id },
    });
};

/**
 * Find the most recently uploaded resume for a user.
 * @param {string} userId
 * @returns {Promise<Resume|null>}
 */
const findLatestByUserId = async (userId) => {
    return prisma.resume.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Find all resumes for a user, ordered newest first.
 * @param {string} userId
 * @returns {Promise<Resume[]>}
 */
const findAllByUserId = async (userId) => {
    return prisma.resume.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

/**
 * Update a resume's fields (e.g. re-extracted skills after re-parse).
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<Resume>}
 */
const update = async (id, updateData) => {
    return prisma.resume.update({
        where: { id },
        data: updateData,
    });
};

/**
 * Hard-delete a resume by ID.
 * Cascades to match_results and ai_suggestions via FK constraints.
 * @param {string} id
 * @returns {Promise<Resume>}
 */
const remove = async (id) => {
    return prisma.resume.delete({ where: { id } });
};

module.exports = {
    create,
    findById,
    findLatestByUserId,
    findAllByUserId,
    update,
    remove,
};
