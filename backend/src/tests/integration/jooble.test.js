/**
 * Integration Tests — Jooble Import
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');
const joobleService = require('../../services/joobleService');

const prisma = new PrismaClient();

// Mock joobleService
jest.mock('../../services/joobleService', () => ({
    fetchJobsFromJooble: jest.fn(),
}));

const makeRecruiterToken = () =>
    jwt.sign(
        { _id: '00000000-0000-0000-0000-000000000002', email: 'recruiter@test.com', role: 'recruiter' },
        process.env.JWT_SECRET || 'fallback_secret_for_dev',
        { expiresIn: '1h' }
    );

beforeAll(async () => await prisma.$connect());
afterEach(async () => {
    await prisma.savedJob.deleteMany({});
    await prisma.matchResult.deleteMany({});
    await prisma.aiSuggestion.deleteMany({});
    await prisma.job.deleteMany({});
    jest.clearAllMocks();
});
afterAll(async () => await prisma.$disconnect());

describe('POST /api/jobs/import-jooble', () => {
    it('should reject requests without auth token', async () => {
        const res = await request(app)
            .post('/api/jobs/import-jooble')
            .send({ keywords: 'javascript' });
        expect(res.statusCode).toBe(401);
    });

    it('should reject non-recruiter/non-admin users', async () => {
        const applicantToken = jwt.sign(
            { _id: '00000000-0000-0000-0000-000000000003', email: 'applicant@test.com', role: 'applicant' },
            process.env.JWT_SECRET || 'fallback_secret_for_dev',
            { expiresIn: '1h' }
        );
        const res = await request(app)
            .post('/api/jobs/import-jooble')
            .set('Authorization', `Bearer ${applicantToken}`)
            .send({ keywords: 'javascript' });
        expect(res.statusCode).toBe(403);
    });

    it('should return 400 if keywords are missing', async () => {
        const res = await request(app)
            .post('/api/jobs/import-jooble')
            .set('Authorization', `Bearer ${makeRecruiterToken()}`)
            .send({ location: 'chicago' });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should import jobs from Jooble and persist to DB', async () => {
        const mockJobs = [
            {
                title: 'Jooble React Dev',
                company: 'Jooble Corp',
                requiredSkills: ['react', 'javascript'],
                minExperience: 2,
                description: 'Build React apps.',
            },
            {
                title: 'Jooble Node Dev',
                company: 'Jooble LLC',
                requiredSkills: ['node.js', 'express'],
                minExperience: 3,
                description: 'Build APIs.',
            }
        ];

        joobleService.fetchJobsFromJooble.mockResolvedValueOnce(mockJobs);

        const res = await request(app)
            .post('/api/jobs/import-jooble')
            .set('Authorization', `Bearer ${makeRecruiterToken()}`)
            .send({ keywords: 'react', location: 'chicago' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);

        // Verify database persistence
        const dbJobs = await prisma.job.findMany();
        expect(dbJobs.length).toBe(2);
        expect(dbJobs.map(j => j.title)).toContain('Jooble React Dev');
        expect(dbJobs.map(j => j.title)).toContain('Jooble Node Dev');
    });

    it('should handle zero jobs found gracefully', async () => {
        joobleService.fetchJobsFromJooble.mockResolvedValueOnce([]);

        const res = await request(app)
            .post('/api/jobs/import-jooble')
            .set('Authorization', `Bearer ${makeRecruiterToken()}`)
            .send({ keywords: 'nonexistent-query-123' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(0);

        const dbJobs = await prisma.job.findMany();
        expect(dbJobs.length).toBe(0);
    });
});
