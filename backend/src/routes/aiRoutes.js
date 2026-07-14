const express = require('express');
const router = express.Router();
const { getResumeSuggestions } = require('../controllers/aiController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validateSuggestions } = require('../middlewares/requestValidator');
const rateLimit = require('express-rate-limit');

// Dedicated rate limiter for AI requests to prevent abuse and API quota exhaustion
const aiSuggestionsLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests for AI suggestions from this IP. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing'
});

// POST /api/ai/resume-suggestions
router.post('/resume-suggestions', verifyToken, validateSuggestions, aiSuggestionsLimiter, getResumeSuggestions);

module.exports = router;
