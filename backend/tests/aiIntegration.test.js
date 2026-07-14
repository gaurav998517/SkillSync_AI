jest.mock('@xenova/transformers', () => ({
    pipeline: jest.fn(),
    cos_sim: jest.fn()
}), { virtual: true });

const request = require('supertest');
const app = require('../src/app');
const Resume = require('../src/models/Resume');
const Job = require('../src/models/Job');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');
const { clearFirestoreDb } = require('../src/config/testUtils');
const cacheService = require('../src/services/cacheService');

describe('AI Suggestions Route Integration Tests', () => {
    let userA, userB, adminUser;
    let tokenA, tokenB, adminToken;
    let resumeA, job;
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

    beforeEach(async () => {
        await clearFirestoreDb();

        // 1. Create Test Users
        // In this codebase User might be created using admin SDK or a model. 
        // Let's create dummy users via Firestore admin directly or models.
        // Let's use direct firestore or User model if it exists.
        // User has a findByIdAndUpdate, so it should be a collection wrapper.
        // Let's check User model exports if we need to.
        userA = { _id: 'user_a', email: 'usera@test.com', role: 'applicant' };
        userB = { _id: 'user_b', email: 'userb@test.com', role: 'applicant' };
        adminUser = { _id: 'admin_user', email: 'admin@test.com', role: 'admin' };

        tokenA = jwt.sign(userA, JWT_SECRET);
        tokenB = jwt.sign(userB, JWT_SECRET);
        adminToken = jwt.sign(adminUser, JWT_SECRET);

        // 2. Create Job
        job = await Job.create({
            title: 'NodeJS Developer',
            company: 'TestCorp',
            requiredSkills: ['node.js', 'react', 'docker'],
            minExperience: 2,
            description: 'We are looking for a software developer skilled in Node.js and React.'
        });

        // 3. Create Resume owned by userA
        resumeA = await Resume.create({
            filename: 'resA.pdf',
            filepath: '/uploads/resA.pdf',
            rawText: 'Developer profile with React and NodeJS.',
            skills: ['react', 'node.js'],
            userId: userA._id
        });
    });

    afterAll(async () => {
        await clearFirestoreDb();
    });

    describe('POST /api/ai/resume-suggestions', () => {
        it('should successfully generate suggestions (cache miss) and then retrieve them (cache hit)', async () => {
            // 1. First request - Cache miss
            const res1 = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    resumeId: resumeA._id,
                    jobId: job._id
                });

            expect(res1.status).toBe(200);
            expect(res1.body.success).toBe(true);
            expect(res1.body.cached).toBe(false);
            expect(res1.body.data.overallAssessment).toBeDefined();
            expect(res1.body.data.suggestedBulletPoints).toBeInstanceOf(Array);

            // 2. Second request - Cache hit
            const res2 = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    resumeId: resumeA._id,
                    jobId: job._id
                });

            expect(res2.status).toBe(200);
            expect(res2.body.success).toBe(true);
            expect(res2.body.cached).toBe(true);
            expect(res2.body.data.overallAssessment).toBe(res1.body.data.overallAssessment);
        });

        it('should allow admin user to fetch suggestions for userA resume', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    resumeId: resumeA._id,
                    jobId: job._id
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject requests with ownership mismatch (403)', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({
                    resumeId: resumeA._id,
                    jobId: job._id
                });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Forbidden');
        });

        it('should reject requests without authorization token (401)', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .send({
                    resumeId: resumeA._id,
                    jobId: job._id
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 validation error if resumeId is missing', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    jobId: job._id
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('resumeId');
        });

        it('should return 400 validation error if jobId is missing', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    resumeId: resumeA._id
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('jobId');
        });

        it('should return 404 if resume does not exist', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    resumeId: 'non_existent_resume_id',
                    jobId: job._id
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Resume not found');
        });

        it('should return 404 if job does not exist', async () => {
            const res = await request(app)
                .post('/api/ai/resume-suggestions')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({
                    resumeId: resumeA._id,
                    jobId: 'non_existent_job_id'
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Job not found');
        });
    });
});
