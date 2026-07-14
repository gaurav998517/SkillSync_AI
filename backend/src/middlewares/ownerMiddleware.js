const resumeRepository = require('../repositories/resumeRepository');

/**
 * Ensures the acting user is modifying or reading their own data.
 * Checks req.params.userId or req.body.userId against the JWT subject.
 */
const requireSelf = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    const paramUserId = req.params.userId;
    const bodyUserId = req.body?.userId;
    const currentUserId = req.user._id; // JWT payload field

    if (req.user.role === 'admin') return next();

    if (paramUserId && paramUserId !== currentUserId) {
        return res.status(403).json({
            success: false,
            message: "Forbidden. You cannot access or modify another user's resources.",
        });
    }

    if (bodyUserId && bodyUserId !== currentUserId) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden. You cannot act on behalf of another user.',
        });
    }

    return next();
};

/**
 * Ensures the acting user owns the requested resume.
 * Recruiters and admins bypass this check.
 */
const requireResumeOwnership = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Authentication required.' });
    }

    const resumeId = req.params.resumeId;
    if (!resumeId) return next();

    try {
        if (req.user.role === 'recruiter' || req.user.role === 'admin') return next();

        const resume = await resumeRepository.findById(resumeId);
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        if (resume.userId !== req.user._id) {
            return res.status(403).json({ success: false, message: 'Forbidden. You do not own this resume.' });
        }

        return next();
    } catch (error) {
        console.error('Error verifying resume ownership:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying resource ownership.' });
    }
};

module.exports = { requireSelf, requireResumeOwnership };
