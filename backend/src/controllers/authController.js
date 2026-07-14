const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');
const auditMiddleware = require('../middlewares/auditMiddleware');

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
        const { name, email, password, role } = req.body;

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

        // Create user (password hashing handled inside repository)
        const newUser = await userRepository.create({ name, email, password, role: role || 'applicant' });

        // Audit: Security-sensitive event — new user registration
        await auditMiddleware.logEvent({
            userId: newUser.id,
            action: 'USER_SIGNUP',
            resource: 'users',
            metadata: { email: newUser.email, role: newUser.role },
            req,
        });

        const token = generateToken(newUser);

        return res.status(201).json({
            success: true,
            token,
            user: {
                _id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
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
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
};

module.exports = { signup, login };
