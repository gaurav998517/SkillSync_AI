const express = require('express');
const router = express.Router();
const { saveJob, getSavedJobs, removeSavedJob, getUserProfile } = require('../controllers/userController');
const { verifyToken, requireEmailVerified } = require('../middlewares/authMiddleware');
const { requireSelf } = require('../middlewares/ownerMiddleware');

// Save a job (requires authentication, verified email, and matching userId)
router.post('/:userId/jobs/:jobId', verifyToken, requireEmailVerified, requireSelf, saveJob);

// Get saved jobs (requires authentication and matching userId)
router.get('/:userId/jobs', verifyToken, requireSelf, getSavedJobs);

// Remove saved job (requires authentication, verified email, and matching userId)
router.delete('/:userId/jobs/:jobId', verifyToken, requireEmailVerified, requireSelf, removeSavedJob);

// Get user profile (requires authentication and matching userId)
router.get('/:userId/profile', verifyToken, requireSelf, getUserProfile);

module.exports = router;
