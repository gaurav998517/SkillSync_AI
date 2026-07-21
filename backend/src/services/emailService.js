const { Resend } = require('resend');
const { verificationEmailTemplate, passwordResetEmailTemplate } = require('./emailTemplates');

let resendClient = null;

const getResendClient = () => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error('Resend API key (RESEND_API_KEY) is not configured in environment variables.');
    }
    if (!resendClient) {
        resendClient = new Resend(apiKey);
    }
    return resendClient;
};

/**
 * Generic transactional email sender. Reusable for verification emails,
 * future password-reset emails, or any other outbound email.
 *
 * @param {object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html    - Email HTML body
 * @returns {Promise<object>} Resend API response data
 */
const sendEmail = async ({ to, subject, html }) => {
    const client = getResendClient();
    const from = process.env.EMAIL_FROM || 'SkillSync AI <onboarding@resend.dev>';

    try {
        const { data, error } = await client.emails.send({ from, to, subject, html });
        if (error) {
            throw new Error(error.message || 'Resend API returned an error');
        }
        return data;
    } catch (error) {
        console.error('[EMAIL SERVICE] Failed to send email:', error.message);
        throw new Error(error.message || 'Failed to send email');
    }
};

/**
 * Sends the "verify your email" message for a newly-registered (or re-requesting) user.
 *
 * @param {object} options
 * @param {string} options.to    - Recipient email address
 * @param {string} options.name  - Recipient display name
 * @param {string} options.token - Raw verification token (unhashed, URL-safe)
 * @returns {Promise<object>}
 */
const sendVerificationEmail = async ({ to, name, token }) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;
    const { subject, html } = verificationEmailTemplate({ name, verifyUrl });
    return sendEmail({ to, subject, html });
};

/**
 * Sends a password-reset link to the user.
 *
 * @param {object} options
 * @param {string} options.to    - Recipient email address
 * @param {string} options.name  - Recipient display name
 * @param {string} options.token - Raw reset token (unhashed, URL-safe)
 * @returns {Promise<object>}
 */
const sendPasswordResetEmail = async ({ to, name, token }) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmailTemplate({ name, resetUrl });
    return sendEmail({ to, subject, html });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
