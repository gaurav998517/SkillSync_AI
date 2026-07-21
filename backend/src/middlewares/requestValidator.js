/**
 * Middleware functions to validate incoming request payloads.
 */

const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Name is required and must be a valid string.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing email address.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password is required and must be at least 6 characters long.' });
    }

    // Role is not accepted from public signup input — see authController.signup.
    return next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Both email and password are required.' });
    }

    return next();
};

const validateVerifyEmail = (req, res, next) => {
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
        return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    return next();
};

const validateResendVerification = (req, res, next) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    return next();
};

const validateForgotPassword = (req, res, next) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }
    return next();
};

const validateJob = (req, res, next) => {
    const { title, company, requiredSkills } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ success: false, message: 'Job title is required and must be a valid string.' });
    }

    if (!company || typeof company !== 'string' || company.trim() === '') {
        return res.status(400).json({ success: false, message: 'Company name is required and must be a valid string.' });
    }

    if (!requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
        return res.status(400).json({ success: false, message: 'Job must specify an array of requiredSkills containing at least one item.' });
    }

    return next();
};

const validateSuggestions = (req, res, next) => {
    const { resumeId, jobId } = req.body;

    if (!resumeId || typeof resumeId !== 'string' || resumeId.trim() === '') {
        return res.status(400).json({ success: false, message: 'resumeId is required and must be a non-empty string.' });
    }

    if (!jobId || typeof jobId !== 'string' || jobId.trim() === '') {
        return res.status(400).json({ success: false, message: 'jobId is required and must be a non-empty string.' });
    }

    return next();
};

const validateGoogleLogin = (req, res, next) => {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string' || credential.trim() === '') {
        return res.status(400).json({ success: false, message: 'Google credential (ID token) is required.' });
    }

    return next();
};

module.exports = {
    validateSignup,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateJob,
    validateSuggestions,
    validateGoogleLogin
};

