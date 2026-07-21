const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { signup, login, verifyEmail, resendVerification, forgotPassword, googleLogin, getAuthConfig } = require('../controllers/authController');
const {
    validateSignup,
    validateLogin,
    validateVerifyEmail,
    validateResendVerification,
    validateForgotPassword,
    validateGoogleLogin,
} = require('../middlewares/requestValidator');

// Rate limiters for the forgot-password endpoint.
// Skipped in test environments (matching the global-limiter pattern in app.js).
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing';

// Per-IP: 10 attempts per hour — blunt throttle against automated scanners.
const forgotPasswordIpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many password reset requests from this IP. Please try again later.' },
});

// Per-email: 5 attempts per hour — prevents hammering a specific account.
// Runs AFTER validateForgotPassword so req.body.email is guaranteed valid.
const forgotPasswordEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => req.body.email.toLowerCase(),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many reset requests for this email. Please try again in an hour.' },
});

// Per-email: 3 attempts per hour — prevents spamming a victim's inbox with verification emails.
// Runs AFTER validateResendVerification so req.body.email is guaranteed valid.
const resendVerificationEmailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyGenerator: (req) => req.body.email.toLowerCase(),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many verification email requests for this address. Please try again after 1 hour.' },
});

// POST /api/auth/login
router.post('/login', validateLogin, login);

// POST /api/auth/signup
router.post('/signup', validateSignup, signup);

// POST /api/auth/google
router.post('/google', validateGoogleLogin, googleLogin);


// POST /api/auth/verify-email
router.post('/verify-email', validateVerifyEmail, verifyEmail);

// POST /api/auth/resend-verification
// Order: validate email format → per-email limiter → handler
router.post(
    '/resend-verification',
    validateResendVerification,
    ...(isTestEnv ? [] : [resendVerificationEmailLimiter]),
    resendVerification
);

// POST /api/auth/forgot-password
// Order: IP limiter → validate email format → email limiter → handler
router.post(
    '/forgot-password',
    ...(isTestEnv ? [] : [forgotPasswordIpLimiter]),
    validateForgotPassword,
    ...(isTestEnv ? [] : [forgotPasswordEmailLimiter]),
    forgotPassword
);

// GET /api/auth/config
router.get('/config', getAuthConfig);

module.exports = router;

