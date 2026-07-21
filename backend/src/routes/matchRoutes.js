const express = require('express');
const router = express.Router();
const { getMatchScore, getAutoMatchForUser } = require('../controllers/matchcontrollers');
const { verifyToken, requireEmailVerified } = require('../middlewares/authMiddleware');
const { requireSelf, requireResumeOwnership } = require('../middlewares/ownerMiddleware');

// GET /api/match/auto/:userId
// Automatically calculate match percentages between latest user Resume and all Jobs (requires owner verification, email must be verified)
router.get('/auto/:userId', verifyToken, requireEmailVerified, requireSelf, getAutoMatchForUser);

// GET /api/match/:resumeId/:jobId
// Calculate real-time match percentage between a Resume and a Job (requires resume ownership check, email must be verified)
router.get('/:resumeId/:jobId', verifyToken, requireEmailVerified, requireResumeOwnership, getMatchScore);

module.exports = router;
