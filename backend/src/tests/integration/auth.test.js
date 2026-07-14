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

describe('POST /api/auth/signup', () => {
    const validUser = {
        name: 'Integration Tester',
        email: 'integtest-signup@example.com',
        password: 'Password123!',
    };

    it('should create a user and return a JWT', async () => {
        const res = await request(app).post('/api/auth/signup').send(validUser);
        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe(validUser.email);
        expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate email with 400', async () => {
        await request(app).post('/api/auth/signup').send(validUser);
        const res = await request(app).post('/api/auth/signup').send(validUser);
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe('User already exists');
    });

    it('should reject missing fields with 400', async () => {
        const res = await request(app).post('/api/auth/signup').send({ email: 'nopw@example.com' });
        expect(res.statusCode).toBe(400);
    });
});

describe('POST /api/auth/login', () => {
    const loginUser = {
        name: 'Login Tester',
        email: 'integtest-login@example.com',
        password: 'LoginPass456!',
    };

    beforeEach(async () => {
        await request(app).post('/api/auth/signup').send(loginUser);
    });

    it('should login with correct credentials and return JWT', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: loginUser.email,
            password: loginUser.password,
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
    });

    it('should reject wrong password with 401', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: loginUser.email,
            password: 'wrongpassword',
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should reject unknown email with 401', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nobody@example.com',
            password: 'doesnotmatter',
        });
        expect(res.statusCode).toBe(401);
    });
});
