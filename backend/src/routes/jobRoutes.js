const express = require('express');
const router = express.Router();
const { createJob, getAllJobs, seedDummyJobs, importJoobleJobs } = require('../controllers/jobController');
const { verifyToken, requireRole, requireEmailVerified } = require('../middlewares/authMiddleware');
const { validateJob } = require('../middlewares/requestValidator');

// @route   POST /api/jobs
// @desc    Create a new job (recruiter or admin role required, email must be verified)
router.post('/', verifyToken, requireRole('recruiter', 'admin'), requireEmailVerified, validateJob, createJob);

// @route   GET /api/jobs
// @desc    Get all jobs (public)
router.get('/', getAllJobs);

// @route   POST /api/jobs/seed
// @desc    Seed backend with dummy jobs (recruiter or admin role required, email must be verified)
router.post('/seed', verifyToken, requireRole('recruiter', 'admin'), requireEmailVerified, seedDummyJobs);

// @route   POST /api/jobs/import-jooble
// @desc    Import jobs from Jooble (recruiter or admin role required, email must be verified)
router.post('/import-jooble', verifyToken, requireRole('recruiter', 'admin'), requireEmailVerified, importJoobleJobs);

module.exports = router;
