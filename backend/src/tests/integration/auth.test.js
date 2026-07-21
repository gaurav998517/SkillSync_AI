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

describe('POST /api/auth/verify-email', () => {
    const signupAndGetToken = async (emailSuffix) => {
        const signupRes = await request(app).post('/api/auth/signup').send({
            name: 'Verify Tester',
            email: `integtest-verify-${emailSuffix}@example.com`,
            password: 'Password123!',
        });
        const userId = signupRes.body.user._id;
        const tokenRecord = await prisma.emailVerificationToken.findFirst({ where: { userId } });
        return { userId, tokenRecord };
    };

    it('should verify a valid token and set emailVerified to true', async () => {
        const { userId, tokenRecord } = await signupAndGetToken('valid');

        const res = await request(app).post('/api/auth/verify-email').send({ token: tokenRecord.token });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const user = await prisma.user.findUnique({ where: { id: userId } });
        expect(user.emailVerified).toBe(true);
    });

    it('should reject a missing token with 400', async () => {
        const res = await request(app).post('/api/auth/verify-email').send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should reject an unknown token with 400 and code TOKEN_INVALID', async () => {
        const res = await request(app).post('/api/auth/verify-email').send({ token: 'not-a-real-token' });
        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('TOKEN_INVALID');
    });

    it('should reject an already-used token with 400 and code TOKEN_USED', async () => {
        const { tokenRecord } = await signupAndGetToken('reused');

        const first = await request(app).post('/api/auth/verify-email').send({ token: tokenRecord.token });
        expect(first.statusCode).toBe(200);

        const second = await request(app).post('/api/auth/verify-email').send({ token: tokenRecord.token });
        expect(second.statusCode).toBe(400);
        expect(second.body.code).toBe('TOKEN_USED');
    });

    it('should reject an expired token with 400 and code TOKEN_EXPIRED', async () => {
        const { tokenRecord } = await signupAndGetToken('expired');
        await prisma.emailVerificationToken.update({
            where: { id: tokenRecord.id },
            data: { expiresAt: new Date(Date.now() - 1000) },
        });

        const res = await request(app).post('/api/auth/verify-email').send({ token: tokenRecord.token });
        expect(res.statusCode).toBe(400);
        expect(res.body.code).toBe('TOKEN_EXPIRED');
    });
});

describe('POST /api/auth/resend-verification', () => {
    it('should invalidate the old token and issue a new working one', async () => {
        const email = 'integtest-resend-fresh@example.com';
        const signupRes = await request(app).post('/api/auth/signup').send({
            name: 'Resend Tester',
            email,
            password: 'Password123!',
        });
        const userId = signupRes.body.user._id;
        const oldToken = await prisma.emailVerificationToken.findFirst({ where: { userId } });

        const resendRes = await request(app).post('/api/auth/resend-verification').send({ email });
        expect(resendRes.statusCode).toBe(200);
        expect(resendRes.body.success).toBe(true);

        const refreshedOldToken = await prisma.emailVerificationToken.findUnique({ where: { id: oldToken.id } });
        expect(refreshedOldToken.usedAt).not.toBeNull();

        const newToken = await prisma.emailVerificationToken.findFirst({
            where: { userId, usedAt: null },
        });
        expect(newToken).not.toBeNull();
        expect(newToken.token).not.toBe(oldToken.token);

        const verifyRes = await request(app).post('/api/auth/verify-email').send({ token: newToken.token });
        expect(verifyRes.statusCode).toBe(200);
    });

    it('should return a generic success response for an unregistered email (no enumeration)', async () => {
        const res = await request(app).post('/api/auth/resend-verification').send({
            email: 'integtest-resend-unknown@example.com',
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should return a generic success response and issue no new token for an already-verified email', async () => {
        const email = 'integtest-resend-verified@example.com';
        const signupRes = await request(app).post('/api/auth/signup').send({
            name: 'Already Verified',
            email,
            password: 'Password123!',
        });
        const userId = signupRes.body.user._id;
        const tokenRecord = await prisma.emailVerificationToken.findFirst({ where: { userId } });
        await request(app).post('/api/auth/verify-email').send({ token: tokenRecord.token });

        const res = await request(app).post('/api/auth/resend-verification').send({ email });
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);

        const activeTokens = await prisma.emailVerificationToken.findMany({ where: { userId, usedAt: null } });
        expect(activeTokens.length).toBe(0);
    });

    it('should reject a missing/invalid email with 400', async () => {
        const res = await request(app).post('/api/auth/resend-verification').send({ email: 'not-an-email' });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

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

