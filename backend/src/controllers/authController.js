const userRepository = require('../repositories/userRepository');
const emailVerificationTokenRepository = require('../repositories/emailVerificationTokenRepository');
const passwordResetTokenRepository = require('../repositories/passwordResetTokenRepository');
const jwt = require('jsonwebtoken');
const auditMiddleware = require('../middlewares/auditMiddleware');
const { generateVerificationToken, generatePasswordResetToken } = require('../utils/tokenGenerator');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { withTransaction } = require('../utils/transaction');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');


// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { _id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret_for_dev',
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check for existing user
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Create user (password hashing handled inside repository).
        // Role is never taken from client input — all public signups are 'applicant'.
        // Privileged roles must be granted separately by an existing admin.
        const newUser = await userRepository.create({ name, email, password, role: 'applicant' });

        // Audit: Security-sensitive event — new user registration
        await auditMiddleware.logEvent({
            userId: newUser.id,
            action: 'USER_SIGNUP',
            resource: 'users',
            metadata: { email: newUser.email, role: newUser.role },
            req,
        });

        // Issue an email verification token and send the verification email.
        // Signup must still succeed even if email delivery fails — the user
        // can request a fresh link via the resend-verification endpoint.
        try {
            const { token: verificationToken, expiresAt } = generateVerificationToken();
            await emailVerificationTokenRepository.create({
                userId: newUser.id,
                token: verificationToken,
                expiresAt,
            });
            await sendVerificationEmail({
                to: newUser.email,
                name: newUser.name,
                token: verificationToken,
            });
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError.message);
        }

        const token = generateToken(newUser);

        return res.status(201).json({
            success: true,
            token,
            user: {
                _id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                emailVerified: newUser.emailVerified,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, message: 'Server error during signup', error: error.message });
    }
};

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Need password hash for comparison — use internal lookup
        const user = await userRepository.findByEmail(email);
        if (!user) {
            // Audit: Failed login attempt (no userId — user doesn't exist)
            await auditMiddleware.logEvent({
                userId: null,
                action: 'LOGIN_FAILED',
                resource: 'users',
                metadata: { email, reason: 'user_not_found' },
                req,
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Fetch with password for verification
        const userWithHash = await userRepository.findByIdWithPassword(user.id);

        let isMatch = false;

        // Handle legacy plaintext passwords (migration path)
        const isHashed =
            userWithHash.passwordHash &&
            (userWithHash.passwordHash.startsWith('$2a$') || userWithHash.passwordHash.startsWith('$2b$'));

        if (isHashed) {
            isMatch = await userRepository.verifyPassword(password, userWithHash.passwordHash);
        } else {
            // Legacy plaintext match
            isMatch = userWithHash.passwordHash === password;
            if (isMatch) {
                console.log(`[authController] Upgrading plaintext password for: ${email}`);
                await userRepository.upgradePassword(user.id, password);
            }
        }

        if (!isMatch) {
            // Audit: Failed login — wrong password
            await auditMiddleware.logEvent({
                userId: user.id,
                action: 'LOGIN_FAILED',
                resource: 'users',
                metadata: { email, reason: 'wrong_password' },
                req,
            });
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Audit: Successful login
        await auditMiddleware.logEvent({
            userId: user.id,
            action: 'USER_LOGIN',
            resource: 'users',
            metadata: { email: user.email },
            req,
        });

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

/**
 * @desc    Verify a user's email address using the token from their verification email.
 *          POST (not GET) because this mutates state — a GET link risks being
 *          pre-fetched/auto-clicked by email clients and security scanners,
 *          which would silently burn the token before the user ever opens the
 *          email. The frontend route in the email link (/verify-email?token=xxx)
 *          is a page that reads the token and makes this POST call itself.
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({ success: false, code: 'TOKEN_MISSING', message: 'Verification token is required.' });
        }

        const record = await emailVerificationTokenRepository.findByToken(token);

        if (!record) {
            return res.status(400).json({ success: false, code: 'TOKEN_INVALID', message: 'Invalid verification token.' });
        }

        if (record.usedAt) {
            return res.status(400).json({ success: false, code: 'TOKEN_USED', message: 'This verification link has already been used.' });
        }

        if (record.expiresAt < new Date()) {
            return res.status(400).json({ success: false, code: 'TOKEN_EXPIRED', message: 'This verification link has expired. Please request a new one.' });
        }

        // Mark the user verified and consume the token atomically — if one
        // write fails the other must roll back, otherwise a user could end up
        // permanently unverified with no valid token left to retry.
        await withTransaction(async (tx) => {
            await tx.user.update({ where: { id: record.userId }, data: { emailVerified: true } });
            await tx.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
        });

        // Audit: Security-sensitive event — email verified
        await auditMiddleware.logEvent({
            userId: record.userId,
            action: 'EMAIL_VERIFIED',
            resource: 'users',
            metadata: {},
            req,
        });

        return res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        console.error('Verify email error:', error);
        return res.status(500).json({ success: false, message: 'Server error during email verification' });
    }
};

/**
 * @desc    Resend the email verification link. Invalidates any previous
 *          unexpired token for the user and issues a fresh one.
 *          Always responds with the same generic message regardless of
 *          whether the email exists or is already verified, to avoid
 *          leaking which addresses are registered (user enumeration).
 * @route   POST /api/auth/resend-verification
 * @access  Public
 */
const resendVerification = async (req, res) => {
    const genericResponse = {
        success: true,
        message: 'If an account with that email exists and is unverified, a new verification email has been sent.',
    };

    try {
        const { email } = req.body;
        const user = await userRepository.findByEmail(email);

        if (!user || user.emailVerified) {
            return res.status(200).json(genericResponse);
        }

        // Invalidate previous unexpired tokens so old links stop working, then issue a new one.
        await emailVerificationTokenRepository.invalidateActiveForUser(user.id);

        const { token: verificationToken, expiresAt } = generateVerificationToken();
        await emailVerificationTokenRepository.create({
            userId: user.id,
            token: verificationToken,
            expiresAt,
        });

        try {
            await sendVerificationEmail({
                to: user.email,
                name: user.name,
                token: verificationToken,
            });
        } catch (emailError) {
            console.error('Failed to resend verification email:', emailError.message);
        }

        return res.status(200).json(genericResponse);
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({ success: false, message: 'Server error while resending verification email' });
    }
};

/**
 * @desc    Request a password reset link
 * @route   POST /api/auth/forgot-password
 * @access  Public
 *
 * SECURITY: Always returns the same response regardless of whether the email
 * exists — do NOT reveal account existence to the caller.
 */
const forgotPassword = async (req, res) => {
    // Defined once so both branches return byte-for-byte identical JSON,
    // preventing timing-based email-enumeration attacks.
    const GENERIC_RESPONSE = {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
    };

    try {
        const { email } = req.body;

        const user = await userRepository.findByEmail(email);
        if (!user) {
            // Do NOT return 404 — that reveals the email is not registered.
            return res.status(200).json(GENERIC_RESPONSE);
        }

        // Invalidate any still-active reset tokens so only the freshest link works.
        await passwordResetTokenRepository.invalidateActiveForUser(user.id);

        // Generate token (15-minute TTL, 256 bits of entropy).
        const { token, expiresAt } = generatePasswordResetToken();
        await passwordResetTokenRepository.create({ userId: user.id, token, expiresAt });

        // Send email — failure must not change the response or reveal user existence.
        try {
            await sendPasswordResetEmail({ to: user.email, name: user.name, token });
        } catch (emailError) {
            console.error('[forgotPassword] Failed to send reset email:', emailError.message);
        }

        await auditMiddleware.logEvent({
            userId: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            resource: 'users',
            metadata: { email: user.email },
            req,
        });

        return res.status(200).json(GENERIC_RESPONSE);
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};

/**
 * @desc    Authenticate/Register user via Google OAuth credential token
 * @route   POST /api/auth/google
 * @access  Public
 */
const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;
        
        let payload;
        
        // Short-circuit in test environments for automated testing
        if (process.env.NODE_ENV === 'test' && credential === 'mock-google-token') {
            payload = {
                email: 'integtest-google@example.com',
                name: 'Google Tester',
                email_verified: true,
            };
        } else {
            const googleClientId = process.env.GOOGLE_CLIENT_ID;
            if (!googleClientId) {
                console.error('GOOGLE_CLIENT_ID is not configured in environment variables');
                return res.status(500).json({ success: false, message: 'Google login is not configured on the server.' });
            }
            
            const client = new OAuth2Client(googleClientId);
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: googleClientId,
            });
            payload = ticket.getPayload();
        }

        if (!payload || !payload.email) {
            return res.status(400).json({ success: false, message: 'Invalid Google credential token.' });
        }

        const email = payload.email.toLowerCase();
        const name = payload.name || 'Google User';

        let user = await userRepository.findByEmail(email);
        let isNewUser = false;

        if (!user) {
            // Register a new user
            isNewUser = true;
            // Generate a secure random password since schema requires passwordHash
            const randomPassword = crypto.randomBytes(32).toString('hex');
            
            user = await userRepository.create({
                name,
                email,
                password: randomPassword,
                role: 'applicant',
                emailVerified: true
            });

            // Log security-sensitive signup event
            await auditMiddleware.logEvent({
                userId: user.id,
                action: 'USER_SIGNUP',
                resource: 'users',
                metadata: { email: user.email, role: user.role, provider: 'google' },
                req,
            });
        } else {
            // Existing user
            if (!user.isActive) {
                return res.status(403).json({ success: false, message: 'Account is deactivated.' });
            }

            // If user exists but is not marked as verified, verify them since they successfully authenticated via Google
            if (!user.emailVerified) {
                user = await userRepository.update(user.id, { emailVerified: true });
            }

            // Log security-sensitive login event
            await auditMiddleware.logEvent({
                userId: user.id,
                action: 'USER_LOGIN',
                resource: 'users',
                metadata: { email: user.email, provider: 'google' },
                req,
            });
        }

        const token = generateToken(user);

        return res.status(isNewUser ? 201 : 200).json({
            success: true,
            token,
            user: {
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
            },
        });

    } catch (error) {
        console.error('Google login error:', error);
        return res.status(500).json({ success: false, message: 'Server error during Google authentication', error: error.message });
    }
};

const getAuthConfig = async (req, res) => {
    return res.status(200).json({
        success: true,
        googleClientId: process.env.GOOGLE_CLIENT_ID || null
    });
};

module.exports = { signup, login, verifyEmail, resendVerification, forgotPassword, googleLogin, getAuthConfig };


