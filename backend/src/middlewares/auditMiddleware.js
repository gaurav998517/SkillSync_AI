const { prisma } = require('../config/database');

/**
 * Audit Middleware — Security-Sensitive Event Logger
 *
 * Only logs the following events:
 *   USER_SIGNUP      — new user registration
 *   USER_LOGIN       — successful login
 *   LOGIN_FAILED     — failed login attempt (wrong password or user not found)
 *   PASSWORD_CHANGE  — user updates their password
 *   EMAIL_VERIFIED   — user confirmed their email address via verification link
 *
 * All writes are non-blocking (fire-and-forget with error catch) so audit
 * logging never delays or breaks the main request flow.
 */

/**
 * Log a security-sensitive event to the audit_logs table.
 * This is a fire-and-forget operation — failures are logged but not re-thrown.
 *
 * @param {object} options
 * @param {string|null} options.userId     - UUID of the acting user (null for failed logins)
 * @param {string}      options.action     - Action name e.g. "USER_SIGNUP"
 * @param {string}      options.resource   - Target resource e.g. "users"
 * @param {object}      [options.metadata] - Additional context (avoid PII beyond email)
 * @param {object}      [options.req]      - Express request object (for IP extraction)
 */
const logEvent = async ({ userId, action, resource, metadata = {}, req = null }) => {
    try {
        const ipAddress = req
            ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null)
            : null;

        await prisma.auditLog.create({
            data: {
                userId: userId || null,
                action,
                resource,
                metadata,
                ipAddress,
            },
        });
    } catch (error) {
        // Never let audit logging crash the main request
        console.error(`[AuditLog] Failed to write audit event "${action}":`, error.message);
    }
};

module.exports = { logEvent };
