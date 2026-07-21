const { prisma } = require('../config/database');

/**
 * PasswordResetToken Repository
 * All database operations for the `password_reset_tokens` table.
 */

/**
 * Create a new password reset token for a user.
 * @param {object} data
 * @param {string} data.userId
 * @param {string} data.token
 * @param {Date}   data.expiresAt
 * @returns {Promise<PasswordResetToken>}
 */
const create = async ({ userId, token, expiresAt }) => {
    return prisma.passwordResetToken.create({
        data: { userId, token, expiresAt },
    });
};

/**
 * Find a reset token by its raw token string.
 * @param {string} token
 * @returns {Promise<PasswordResetToken|null>}
 */
const findByToken = async (token) => {
    return prisma.passwordResetToken.findUnique({
        where: { token },
    });
};

/**
 * Mark a token as used (consumed by a successful password reset).
 * @param {string} id
 * @returns {Promise<PasswordResetToken>}
 */
const markUsed = async (id) => {
    return prisma.passwordResetToken.update({
        where: { id },
        data: { usedAt: new Date() },
    });
};

/**
 * Invalidate all currently-active (unused, unexpired) reset tokens for a user.
 * Called before issuing a fresh token so previous reset links stop working.
 * @param {string} userId
 * @returns {Promise<{count: number}>}
 */
const invalidateActiveForUser = async (userId) => {
    return prisma.passwordResetToken.updateMany({
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
