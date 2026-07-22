/**
 * Unit Tests — UserRepository
 */
const { PrismaClient } = require('@prisma/client');
const userRepository = require('../../../repositories/userRepository');

// Use a real Prisma client against the test database
const prisma = new PrismaClient();

beforeAll(async () => {
    await prisma.$connect();
});

afterEach(async () => {
    // Clean users table after each test to ensure isolation
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({});
});

afterAll(async () => {
    await prisma.$disconnect();
});

describe('UserRepository', () => {
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePassword123!',
        role: 'applicant',
    };

    describe('create()', () => {
        it('should create a user and return without passwordHash', async () => {
            const user = await userRepository.create(testUser);

            expect(user).toBeDefined();
            expect(user.id).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(user.name).toBe('Test User');
            expect(user.role).toBe('applicant');
            // Password hash must never be returned by create()
            expect(user.passwordHash).toBeUndefined();
        });

        it('should lowercase the email on create', async () => {
            const user = await userRepository.create({ ...testUser, email: 'TEST@EXAMPLE.COM' });
            expect(user.email).toBe('test@example.com');
        });

        it('should hash the password before saving', async () => {
            await userRepository.create(testUser);
            const raw = await prisma.user.findFirst({ where: { email: testUser.email } });
            expect(raw.passwordHash).not.toBe(testUser.password);
            expect(raw.passwordHash).toMatch(/^\$2[ab]\$/);
        });
    });

    describe('findByEmail()', () => {
        it('should return a user by email', async () => {
            await userRepository.create(testUser);
            const found = await userRepository.findByEmail('test@example.com');
            expect(found).not.toBeNull();
            expect(found.email).toBe('test@example.com');
        });

        it('should return null for non-existent email', async () => {
            const found = await userRepository.findByEmail('nobody@example.com');
            expect(found).toBeNull();
        });
    });

    describe('findById()', () => {
        it('should return a user by UUID', async () => {
            const created = await userRepository.create(testUser);
            const found = await userRepository.findById(created.id);
            expect(found).not.toBeNull();
            expect(found.id).toBe(created.id);
        });

        it('should return null for unknown UUID', async () => {
            const found = await userRepository.findById('00000000-0000-0000-0000-000000000000');
            expect(found).toBeNull();
        });
    });

    describe('softDelete()', () => {
        it('should mark user as deleted without removing from DB', async () => {
            const created = await userRepository.create(testUser);
            await userRepository.softDelete(created.id);

            // findById should return null (filters isDeleted=false)
            const found = await userRepository.findById(created.id);
            expect(found).toBeNull();

            // But the raw record should still exist in the database
            const raw = await prisma.user.findUnique({ where: { id: created.id } });
            expect(raw).not.toBeNull();
            expect(raw.isDeleted).toBe(true);
        });
    });
});
