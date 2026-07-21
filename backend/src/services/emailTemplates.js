/**
 * HTML templates for transactional emails.
 * Each template function returns { subject, html } ready to hand to sendEmail().
 */

const verificationEmailTemplate = ({ name, verifyUrl }) => ({
    subject: 'Verify your SkillSync AI email address',
    html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">Verify your email</h2>
            <p>Hi ${name},</p>
            <p>Thanks for signing up for SkillSync AI. Please confirm your email address to finish setting up your account.</p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                    Verify Email Address
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4f46e5; font-size: 13px;">${verifyUrl}</p>
            <p style="color: #666; font-size: 13px; margin-top: 32px;">
                This link expires in 24 hours. If you didn't create a SkillSync AI account, you can safely ignore this email.
            </p>
        </div>
    `,
});

const passwordResetEmailTemplate = ({ name, resetUrl }) => ({
    subject: 'Reset your SkillSync AI password',
    html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1a1a1a;">
            <h2 style="color: #4f46e5; margin-bottom: 8px;">Reset your password</h2>
            <p>Hi ${name},</p>
            <p>We received a request to reset the password for your SkillSync AI account. Click the button below to choose a new one.</p>
            <p style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4f46e5; font-size: 13px;">${resetUrl}</p>
            <p style="color: #666; font-size: 13px; margin-top: 32px;">
                This link expires in 15 minutes. If you didn't request a password reset, you can safely ignore this email — your password will not change.
            </p>
        </div>
    `,
});

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate };
