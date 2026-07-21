const crypto = require('crypto');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000;    // 15 minutes

/**
 * Generates a cryptographically random, URL-safe token plus its expiry timestamp.
 * Uses crypto.randomBytes (CSPRNG) — never Math.random() or sequential IDs.
 *
 * @param {number} [bytes=32] - Number of random bytes to generate (32 bytes = 256 bits of entropy).
 * @returns {{ token: string, expiresAt: Date }}
 *
 * @example
 * const { token, expiresAt } = generateVerificationToken();
 */
const generateVerificationToken = (bytes = 32) => {
    const token = crypto.randomBytes(bytes).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);
    return { token, expiresAt };
};

/**
 * Generates a cryptographically random password-reset token (15-minute TTL).
 * Shorter window than email verification because account takeover risk is higher.
 *
 * @param {number} [bytes=32]
 * @returns {{ token: string, expiresAt: Date }}
 */
const generatePasswordResetToken = (bytes = 32) => {
    const token = crypto.randomBytes(bytes).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
    return { token, expiresAt };
};

module.exports = {
    generateVerificationToken,
    VERIFICATION_TOKEN_TTL_MS,
    generatePasswordResetToken,
    PASSWORD_RESET_TOKEN_TTL_MS,
};
