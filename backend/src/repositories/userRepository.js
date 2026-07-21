const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * User Repository
 * All database operations for the `users` table.
 * Controllers and services should import from here — never use Prisma directly.
 */

/**
 * Find a user by email address (case-insensitive).
 * @param {string} email
 * @returns {Promise<User|null>}
 */
const findByEmail = async (email) => {
    return prisma.user.findFirst({
        where: {
            email: email.toLowerCase(),
            isDeleted: false,
        },
    });
};

/**
 * Find a user by UUID.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
const findById = async (id) => {
    return prisma.user.findFirst({
        where: {
            id,
            isDeleted: false,
        },
    });
};

/**
 * Find a user by UUID — includes password hash.
 * Use ONLY for authentication checks; never return this to the client.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
const findByIdWithPassword = async (id) => {
    return prisma.user.findFirst({
        where: { id, isDeleted: false },
        select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

/**
 * Create a new user. Automatically hashes the plaintext password.
 * @param {object} userData - { name, email, password (plaintext), role, emailVerified }
 * @returns {Promise<User>} Created user (without passwordHash)
 */
const create = async ({ name, email, password, role = 'applicant', emailVerified = false }) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    return prisma.user.create({
        data: {
            name,
            email: email.toLowerCase(),
            passwordHash,
            role,
            emailVerified,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

/**
 * Update user fields by ID.
 * If `password` is provided in updateData, it will be hashed automatically.
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<User>}
 */
const update = async (id, updateData) => {
    const dataToUpdate = { ...updateData };

    if (dataToUpdate.password) {
        const isAlreadyHashed =
            dataToUpdate.password.startsWith('$2a$') ||
            dataToUpdate.password.startsWith('$2b$');
        if (!isAlreadyHashed) {
            const salt = await bcrypt.genSalt(10);
            dataToUpdate.passwordHash = await bcrypt.hash(dataToUpdate.password, salt);
        }
        delete dataToUpdate.password;
    }

    return prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });
};

/**
 * Soft-delete a user (sets isDeleted = true).
 * Does NOT remove from database — preserves referential integrity for audit logs.
 * @param {string} id
 * @returns {Promise<User>}
 */
const softDelete = async (id) => {
    return prisma.user.update({
        where: { id },
        data: { isDeleted: true, isActive: false },
    });
};

/**
 * Verify a plaintext password against the stored hash.
 * @param {string} plaintext - Password entered by user
 * @param {string} hash - Stored bcrypt hash
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plaintext, hash) => {
    return bcrypt.compare(plaintext, hash);
};

/**
 * Upgrade a plaintext password to bcrypt hash.
 * Used for legacy password migration on login.
 * @param {string} id
 * @param {string} plaintextPassword
 * @returns {Promise<void>}
 */
const upgradePassword = async (id, plaintextPassword) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(plaintextPassword, salt);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
};

module.exports = {
    findByEmail,
    findById,
    findByIdWithPassword,
    create,
    update,
    softDelete,
    verifyPassword,
    upgradePassword,
};
