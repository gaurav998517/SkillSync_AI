const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');
const auditMiddleware = require('../middlewares/auditMiddleware');
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

module.exports = { googleLogin, getAuthConfig };


