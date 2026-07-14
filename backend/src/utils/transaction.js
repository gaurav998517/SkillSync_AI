const { prisma } = require('../config/database');

/**
 * Executes a callback inside a Prisma interactive transaction.
 * All Prisma operations inside the callback share the same transaction context (tx).
 * If the callback throws, the entire transaction is rolled back automatically.
 *
 * @param {Function} callback - Async function receiving `tx` (Prisma transaction client)
 * @returns {Promise<*>} The return value of the callback
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const resume = await tx.resume.create({ data: resumeData });
 *   await tx.user.update({ where: { id: userId }, data: { recentResumeId: resume.id } });
 *   return resume;
 * });
 */
const withTransaction = async (callback) => {
    return prisma.$transaction(callback, {
        maxWait: 5000,  // Max ms to wait for a connection from pool
        timeout: 10000, // Max ms the transaction can run before automatic rollback
    });
};

module.exports = { withTransaction };
