/**
 * Integration Tests — Jobs Routes
 */
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const makeAdminToken = () =>
    jwt.sign(
        { _id: '00000000-0000-0000-0000-000000000001', email: 'admin@test.com', role: 'admin' },
        process.env.JWT_SECRET || 'fallback_secret_for_dev',
        { expiresIn: '1h' }
    );

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
});
afterAll(async () => await prisma.$disconnect());

describe('GET /api/jobs', () => {
    it('should return empty array when no jobs exist', async () => {
        const res = await request(app).get('/api/jobs');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return all active jobs', async () => {
        await prisma.job.create({
            data: { title: 'SWE', company: 'Corp', requiredSkills: ['react'], description: 'Build.', minExperience: 0 },
        });
        const res = await request(app).get('/api/jobs');
        expect(res.statusCode).toBe(200);
        expect(res.body.count).toBeGreaterThanOrEqual(1);
    });
});

describe('POST /api/jobs', () => {
    const validJob = {
        title: 'Test Engineer',
        company: 'TestCo',
        requiredSkills: ['jest', 'node.js'],
        minExperience: 1,
        description: 'Write tests.',
    };

    it('should create a job with recruiter token', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${makeRecruiterToken()}`)
            .send(validJob);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe('Test Engineer');
    });

    it('should reject job creation without auth token', async () => {
        const res = await request(app).post('/api/jobs').send(validJob);
        expect(res.statusCode).toBe(401);
    });

    it('should reject missing required fields', async () => {
        const res = await request(app)
            .post('/api/jobs')
            .set('Authorization', `Bearer ${makeRecruiterToken()}`)
            .send({ title: 'Incomplete Job' });
        expect(res.statusCode).toBe(400);
    });
});
