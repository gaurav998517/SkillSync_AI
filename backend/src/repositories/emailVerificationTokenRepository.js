const { prisma } = require('../config/database');

/**
 * EmailVerificationToken Repository
 * All database operations for the `email_verification_tokens` table.
 */

/**
 * Create a new email verification token for a user.
 * @param {object} data
 * @param {string} data.userId
 * @param {string} data.token
 * @param {Date} data.expiresAt
 * @returns {Promise<EmailVerificationToken>}
 */
const create = async ({ userId, token, expiresAt }) => {
    return prisma.emailVerificationToken.create({
        data: { userId, token, expiresAt },
    });
};

/**
 * Find a verification token by its raw token string.
 * @param {string} token
 * @returns {Promise<EmailVerificationToken|null>}
 */
const findByToken = async (token) => {
    return prisma.emailVerificationToken.findUnique({
        where: { token },
    });
};

/**
 * Mark a token as used (consumed by a successful verification).
 * @param {string} id
 * @returns {Promise<EmailVerificationToken>}
 */
const markUsed = async (id) => {
    return prisma.emailVerificationToken.update({
        where: { id },
        data: { usedAt: new Date() },
    });
};

/**
 * Invalidate all currently-active (unused, unexpired) tokens for a user.
 * Used when issuing a fresh token so old verification links stop working.
 * @param {string} userId
 * @returns {Promise<{count: number}>}
 */
const invalidateActiveForUser = async (userId) => {
    return prisma.emailVerificationToken.updateMany({
        where: {
            userId,
            usedAt: null,
            expiresAt: { gt: new Date() },
        },
        data: { usedAt: new Date() },
    });
};

module.exports = {
    create,
    findByToken,
    markUsed,
    invalidateActiveForUser,
};
