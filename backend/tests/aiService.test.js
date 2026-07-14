const aiService = require('../src/services/ai/aiService');
const { buildPrompt } = require('../src/services/ai/promptBuilder');
const { parseResponse } = require('../src/services/ai/responseParser');
const cacheService = require('../src/services/cacheService');
const { db } = require('../src/config/firebase');
const { clearFirestoreDb } = require('../src/config/testUtils');

describe('AI Suggestions Unit & Caching Tests', () => {
    beforeEach(async () => {
        await clearFirestoreDb();
    });

    afterAll(async () => {
        await clearFirestoreDb();
    });

    describe('Prompt Builder', () => {
        it('should build a prompt containing all parameters', () => {
            const prompt = buildPrompt({
                resumeText: 'Frontend Developer with React',
                jobDescription: 'Looking for React Dev with Docker',
                matchPercentage: 50,
                matchedSkills: ['react'],
                missingSkills: ['docker']
            });

            expect(prompt).toContain('Frontend Developer with React');
            expect(prompt).toContain('Looking for React Dev with Docker');
            expect(prompt).toContain('50%');
            expect(prompt).toContain('react');
            expect(prompt).toContain('docker');
        });
    });

    describe('Response Parser', () => {
        it('should correctly parse valid JSON', () => {
            const raw = `
            {
                "overallAssessment": "Good match",
                "strengths": ["React"],
                "weaknesses": ["Docker"],
                "missingSkillsExplanation": ["Docker is needed"],
                "resumeImprovements": ["Add Docker"],
                "suggestedBulletPoints": ["Dockerized apps"],
                "projectRecommendations": ["Create Docker app"],
                "atsOptimizationTips": ["Use Docker word"]
            }
            `;
            const parsed = parseResponse(raw);
            expect(parsed.overallAssessment).toBe("Good match");
            expect(parsed.strengths).toEqual(["React"]);
        });

        it('should clean Markdown backticks and parse correctly', () => {
            const raw = '```json\n{"overallAssessment": "Markdown clean", "strengths": []}\n```';
            const parsed = parseResponse(raw);
            expect(parsed.overallAssessment).toBe("Markdown clean");
        });

        it('should fallback to default object on JSON syntax error', () => {
            const raw = '{invalid_json}';
            const parsed = parseResponse(raw);
            expect(parsed.overallAssessment).toContain('Failed to parse');
            expect(parsed.strengths).toBeDefined();
        });
    });

    describe('Cache Service', () => {
        it('should save and retrieve suggestions from cache', async () => {
            const resumeId = 'resume_123';
            const jobId = 'job_456';
            const suggestions = {
                overallAssessment: "Great developer profile",
                strengths: ["Clean code"],
                weaknesses: [],
                missingSkillsExplanation: [],
                resumeImprovements: [],
                suggestedBulletPoints: [],
                projectRecommendations: [],
                atsOptimizationTips: []
            };

            // Initial get should return null
            const miss = await cacheService.getCachedSuggestions(resumeId, jobId);
            expect(miss).toBeNull();

            // Save to cache
            await cacheService.cacheSuggestions(resumeId, jobId, suggestions);

            // Read from cache
            const hit = await cacheService.getCachedSuggestions(resumeId, jobId);
            expect(hit).toBeDefined();
            expect(hit.overallAssessment).toBe("Great developer profile");
        });

        it('should return null if cache has expired', async () => {
            const resumeId = 'resume_expired';
            const jobId = 'job_expired';
            const suggestions = { overallAssessment: "Expired profile" };

            // Save directly into database with expired date to simulate TTL expiration
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 1000); // 1 second in the past

            await db.collection('aiSuggestions').add({
                resumeId,
                jobId,
                suggestions,
                createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                expiresAt: expiredDate
            });

            const hit = await cacheService.getCachedSuggestions(resumeId, jobId);
            expect(hit).toBeNull();
        });
    });
});
