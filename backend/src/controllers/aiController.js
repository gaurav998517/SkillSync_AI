const resumeRepository = require('../repositories/resumeRepository');
const jobRepository = require('../repositories/jobRepository');
const matchRepository = require('../repositories/matchRepository');
const aiSuggestionRepository = require('../repositories/aiSuggestionRepository');
const { calculateMatch } = require('../services/matchService');
const aiService = require('../services/ai/aiService');

/**
 * POST /api/ai/resume-suggestions
 * Generates resume improvement recommendations based on a resume and job description.
 */
const getResumeSuggestions = async (req, res, next) => {
    try {
        const { resumeId, jobId } = req.body;

        // Demo Mode — allows frontend preview without real DB records
        if (resumeId === 'demo_resume_id' || jobId === 'demo_job_id') {
            const mockSuggestions = {
                overallAssessment: "Excellent fit for this Full Stack role. Your frontend skills match well, but adding cloud/containerization tools will maximize compatibility.",
                strengths: ["Strong React experience", "Solid Node.js backend foundation"],
                weaknesses: ["Missing Docker exposure", "AWS experience is absent"],
                missingSkillsExplanation: [
                    "AWS: Most enterprise systems deploy Node/React services on AWS ECS or EC2.",
                    "Docker: Containerization is standard for team collaboration and DevOps workflows.",
                ],
                resumeImprovements: [
                    "Add a dedicated 'DevOps/Tools' section in your skills layout.",
                    "Mention AWS services used in your past projects under your professional experience.",
                ],
                suggestedBulletPoints: [
                    "Containerized a multi-service Node.js & React app with Docker Compose, simplifying development onboarding.",
                    "Configured and maintained AWS S3 and CloudFront distributions for optimized assets delivery (40% speed boost).",
                ],
                projectRecommendations: [
                    "Deploy a mini backend service to AWS EC2 using a CI/CD pipeline.",
                    "Dockerize your portfolio website and deploy it to a cloud provider.",
                ],
                atsOptimizationTips: [
                    "Ensure 'AWS' and 'Docker' keywords appear at least twice in your resume.",
                    "Use action verbs like 'Containerized' and 'Configured' to start experience bullets.",
                ],
            };
            return res.status(200).json({ success: true, data: mockSuggestions, cached: true });
        }

        if (!resumeId || !jobId) {
            return res.status(400).json({ success: false, message: 'Both resumeId and jobId are required fields.' });
        }

        // Fetch resume and job
        const resume = await resumeRepository.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        const job = await jobRepository.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found.' });
        }

        // Verify ownership
        if (req.user.role !== 'admin' && resume.userId !== req.user._id) {
            return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
        }

        // Check PostgreSQL cache
        const cachedResult = await aiSuggestionRepository.getCached(resumeId, jobId);
        if (cachedResult) {
            return res.status(200).json({ success: true, data: cachedResult, cached: true });
        }

        // Run match engine
        const matchResult = await calculateMatch(resume.skills || [], job.requiredSkills || []);

        // Call AI provider
        const suggestions = await aiService.getResumeSuggestions({
            resumeText: resume.rawText || '',
            jobDescription: job.description || '',
            matchPercentage: matchResult.matchPercentage,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills,
        });

        // Persist to PostgreSQL cache
        await aiSuggestionRepository.upsert(resumeId, jobId, suggestions);

        return res.status(200).json({ success: true, data: suggestions, cached: false });
    } catch (error) {
        console.error('[aiController] Error generating resume suggestions:', error);
        return next(error);
    }
};

module.exports = { getResumeSuggestions };
