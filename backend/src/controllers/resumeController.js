const fs = require('fs');
const resumeRepository = require('../repositories/resumeRepository');
const userRepository = require('../repositories/userRepository');
const { parseResumeFile } = require('../services/fileParserService');
const { extractSkills } = require('../services/skillExtractionService');
const { extractExperience } = require('../services/experienceService');
const { withTransaction } = require('../utils/transaction');

// Best-effort cleanup — never let a cleanup failure mask the original response.
const cleanupUploadedFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err && err.code !== 'ENOENT') {
            console.error('Failed to clean up uploaded file:', err.message);
        }
    });
};

/**
 * @desc    Upload resume, parse it, extract skills, persist to DB
 * @route   POST /api/resume/upload
 * @access  Private
 */
const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const originalName = req.file.sanitizedName || req.file.originalname;

        // 1. Extract raw text from PDF/DOCX
        let rawText;
        try {
            rawText = await parseResumeFile(filePath);
        } catch (error) {
            console.error('File parsing error:', error);
            cleanupUploadedFile(filePath);
            return res.status(400).json({ success: false, message: error.message || 'Failed to parse file' });
        }

        if (!rawText || rawText.trim() === '') {
            cleanupUploadedFile(filePath);
            return res.status(400).json({ success: false, message: 'No readable text found in resume' });
        }

        // 2. Extract skills via dictionary NLP
        const skills = extractSkills(rawText);
        if (!skills || skills.length === 0) {
            cleanupUploadedFile(filePath);
            return res.status(400).json({ success: false, message: 'No skills extracted from resume' });
        }

        // Extract experience
        const experience = extractExperience(rawText);

        const userId = req.body.userId || null;

        // 3. Persist resume + update user's latest resume ID atomically
        let resume;
        if (userId) {
            resume = await withTransaction(async (tx) => {
                const created = await tx.resume.create({
                    data: {
                        userId,
                        filename: originalName,
                        filepath: filePath,
                        rawText,
                        skills: skills.map((s) => s.toLowerCase().trim()),
                        education: [],
                        experience,
                    },
                });

                // Update user's skills snapshot and latest resume pointer
                await tx.user.update({
                    where: { id: userId },
                    data: { updatedAt: new Date() },
                });

                return created;
            });
        } else {
            // Anonymous upload (no userId)
            resume = await resumeRepository.create({
                filename: originalName,
                filepath: filePath,
                rawText,
                skills,
                education: [],
                experience,
            });
        }

        // Normalize id → _id for frontend compatibility
        const { id, ...rest } = resume;
        return res.status(200).json({
            success: true,
            data: { _id: id, ...rest },
        });
    } catch (error) {
        console.error('Resume upload/process error:', error);
        if (req.file?.path) {
            cleanupUploadedFile(req.file.path);
        }
        return res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};

module.exports = { uploadResume };
