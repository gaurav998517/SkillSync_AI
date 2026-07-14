const resumeRepository = require('../repositories/resumeRepository');
const jobRepository = require('../repositories/jobRepository');
const matchRepository = require('../repositories/matchRepository');
const { calculateMatch } = require('../services/matchService');

/**
 * GET /api/match/:resumeId/:jobId
 * Calculates (and persists) the match score between a specific resume and job.
 */
const getMatchScore = async (req, res) => {
    try {
        const { resumeId, jobId } = req.params;

        const resume = await resumeRepository.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        const job = await jobRepository.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        const matchResult = await calculateMatch(resume.skills, job.requiredSkills);

        // Persist match result
        await matchRepository.upsert({
            resumeId: resume.id,
            jobId: job.id,
            score: matchResult.matchPercentage,
            matchedSkills: matchResult.matched_skills,
            missingSkills: matchResult.missing_skills,
        });

        return res.status(200).json({ success: true, data: matchResult });
    } catch (error) {
        console.error('Match Service Error:', error);
        return res.status(500).json({ success: false, message: 'Server error while calculating match score', error: error.message });
    }
};

/**
 * GET /api/match/auto/:userId
 * Ranks all active jobs against a user's latest resume.
 */
const getAutoMatchForUser = async (req, res) => {
    try {
        const { userId } = req.params;

        let latestResume = null;
        if (userId && userId !== 'testuser123') {
            latestResume = await resumeRepository.findLatestByUserId(userId);
        }

        if (!latestResume) {
            return res.status(404).json({
                success: false,
                message: 'No resume found. Please upload a resume first to see job matches.',
            });
        }

        const allJobs = await jobRepository.findAll();
        if (!allJobs || allJobs.length === 0) {
            return res.status(200).json({ success: true, data: [], message: 'No jobs available to match against.' });
        }

        const rankedJobs = await Promise.all(
            allJobs.map(async (job) => {
                const matchResult = await calculateMatch(latestResume.skills, job.requiredSkills);

                matchRepository.upsert({
                    resumeId: latestResume.id,
                    jobId: job.id,
                    score: matchResult.matchPercentage,
                    matchedSkills: matchResult.matched_skills,
                    missingSkills: matchResult.missing_skills,
                }).catch((err) => console.error(`[matchController] Failed to persist: ${err.message}`));

                return {
                    job: {
                        _id: job.id,
                        title: job.title,
                        company: job.company,
                        minExperience: job.minExperience,
                        description: job.description,
                        requiredSkills: job.requiredSkills,
                    },
                    matchDetails: matchResult,
                };
            })
        );

        rankedJobs.sort((a, b) => b.matchDetails.matchPercentage - a.matchDetails.matchPercentage);

        return res.status(200).json({
            success: true,
            resumeUsed: latestResume.id,
            data: rankedJobs,
        });
    } catch (error) {
        console.error('Auto Match Service Error:', error);
        return res.status(500).json({ success: false, message: 'Server error while calculating auto match scores', error: error.message });
    }
};

module.exports = { getMatchScore, getAutoMatchForUser };
