/**
 * Middleware functions to validate incoming request payloads.
 */

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
    validateJob,
    validateSuggestions,
    validateGoogleLogin
};

