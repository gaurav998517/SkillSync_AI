/**
 * Integration Tests — Auth Routes
 * Tests the full request/response cycle against the real DB.
 */
const request = require('supertest');
const app = require('../../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

beforeAll(async () => await prisma.$connect());
afterEach(async () => {
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { contains: 'integtest' } } });
});
afterAll(async () => await prisma.$disconnect());

describe('POST /api/auth/google', () => {
    afterEach(async () => {
        await prisma.user.deleteMany({ where: { email: 'integtest-google@example.com' } });
    });

    it('should register and return a JWT for a new Google user', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'mock-google-token' });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('integtest-google@example.com');
        expect(res.body.user.name).toBe('Google Tester');
        expect(res.body.user.emailVerified).toBe(true);

        // Check if user was saved in DB
        const savedUser = await prisma.user.findFirst({ where: { email: 'integtest-google@example.com' } });
        expect(savedUser).not.toBeNull();
        expect(savedUser.emailVerified).toBe(true);
    });

    it('should log in and return a JWT for an existing Google user', async () => {
        // Create the user first
        await request(app)
            .post('/api/auth/google')
            .send({ credential: 'mock-google-token' });

        // Try logging in again
        const res = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'mock-google-token' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('integtest-google@example.com');
    });

    it('should reject a request with missing credential token', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Google credential (ID token) is required.');
    });
});

