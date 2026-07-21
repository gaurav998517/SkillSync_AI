const userRepository = require('../repositories/userRepository');
const savedJobRepository = require('../repositories/savedJobRepository');
const resumeRepository = require('../repositories/resumeRepository');
const matchRepository = require('../repositories/matchRepository');

/**
 * @desc    Save a job for a user
 * @route   POST /api/users/:userId/jobs/:jobId
 * @access  Private (owner)
 */
const saveJob = async (req, res) => {
    try {
        const { userId, jobId } = req.params;

        // Verify user exists and check for duplicate in parallel
        const [user, alreadySaved] = await Promise.all([
            userRepository.findById(userId),
            savedJobRepository.existsByUserAndJob(userId, jobId)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (alreadySaved) {
            return res.status(400).json({ success: false, message: 'Job already saved' });
        }

        await savedJobRepository.save(userId, jobId);
        return res.status(200).json({ success: true, message: 'Job saved successfully' });
    } catch (error) {
        // Handle FK violation (job not found)
        if (error.code === 'P2003') {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }
        // Handle unique-constraint violation (concurrent duplicate save)
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Job already saved' });
        }
        console.error('Save job error:', error);
        res.status(500).json({ success: false, message: 'Server error saving job', error: error.message });
    }
};

/**
 * @desc    Get user's saved jobs (full job objects)
 * @route   GET /api/users/:userId/jobs
 * @access  Private (owner)
 */
const getSavedJobs = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user and saved jobs in parallel
        const [user, savedJobs] = await Promise.all([
            userRepository.findById(userId),
            savedJobRepository.findAllByUserId(userId)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({ success: true, data: savedJobs });
    } catch (error) {
        console.error('Get saved jobs error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching saved jobs', error: error.message });
    }
};

/**
 * @desc    Remove a saved job for a user
 * @route   DELETE /api/users/:userId/jobs/:jobId
 * @access  Private (owner)
 */
const removeSavedJob = async (req, res) => {
    try {
        const { userId, jobId } = req.params;

        // Verify user exists and check if the job is saved in parallel
        const [user, exists] = await Promise.all([
            userRepository.findById(userId),
            savedJobRepository.existsByUserAndJob(userId, jobId)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!exists) {
            return res.status(404).json({ success: false, message: 'Saved job not found' });
        }

        await savedJobRepository.remove(userId, jobId);

        return res.status(200).json({ success: true, message: 'Job removed from saved list' });
    } catch (error) {
        // Prisma P2025 — record to delete not found
        if (error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'Saved job not found' });
        }
        console.error('Remove saved job error:', error);
        res.status(500).json({ success: false, message: 'Server error removing job', error: error.message });
    }
};

/**
 * @desc    Get user profile (no password)
 * @route   GET /api/users/:userId/profile
 * @access  Private (owner)
 */
const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch user and resumes in parallel
        const [user, resumes] = await Promise.all([
            userRepository.findById(userId),
            resumeRepository.findAllByUserId(userId)
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const latestResume = resumes[0] || null;

        // Fetch user's match results if latest resume exists
        let matchResults = [];
        if (latestResume) {
            matchResults = await matchRepository.findByResume(latestResume.id);
        }

        const resumesCount = resumes.length;
        const jobsMatchedCount = matchResults.length;
        
        let avgMatchScore = 0;
        if (jobsMatchedCount > 0) {
            const totalScore = matchResults.reduce((acc, curr) => acc + curr.score, 0);
            avgMatchScore = Math.round(totalScore / jobsMatchedCount);
        }

        // Normalize id field to _id for frontend compatibility
        const { id, ...rest } = user;
        return res.status(200).json({
            success: true,
            data: {
                _id: id,
                ...rest,
                skills: latestResume ? latestResume.skills : [],
                education: latestResume ? latestResume.education : [],
                latestResume: latestResume ? {
                    id: latestResume.id,
                    filename: latestResume.filename,
                    createdAt: latestResume.createdAt,
                    skills: latestResume.skills,
                    education: latestResume.education,
                    experience: latestResume.experience,
                } : null,
                resumesCount,
                jobsMatchedCount,
                avgMatchScore,
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error fetching profile', error: error.message });
    }
};

module.exports = {
    saveJob,
    getSavedJobs,
    removeSavedJob,
    getUserProfile,
};
