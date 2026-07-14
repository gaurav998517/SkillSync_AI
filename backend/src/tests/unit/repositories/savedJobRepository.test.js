/**
 * Unit Tests — SavedJobRepository
 */
const { PrismaClient } = require('@prisma/client');
const savedJobRepository = require('../../../repositories/savedJobRepository');

const prisma = new PrismaClient();

let testUserId, testJobId;

beforeAll(async () => {
    await prisma.$connect();
});

beforeEach(async () => {
    // Seed a user and a job for use across tests
    const user = await prisma.user.create({
        data: { name: 'Save Tester', email: `savetester-${Date.now()}-${Math.random()}@example.com`, passwordHash: 'hash', role: 'applicant' },
    });
    testUserId = user.id;

    const job = await prisma.job.create({
        data: { title: 'SWE', company: 'Acme', requiredSkills: ['react'], description: 'Build stuff.', minExperience: 1 },
    });
    testJobId = job.id;
});

afterEach(async () => {
    await prisma.savedJob.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.user.deleteMany({});
});

afterAll(async () => {
    await prisma.$disconnect();
});


describe('SavedJobRepository', () => {
    describe('save()', () => {
        it('should save a job for a user', async () => {
            await savedJobRepository.save(testUserId, testJobId);
            const exists = await savedJobRepository.existsByUserAndJob(testUserId, testJobId);
            expect(exists).toBe(true);
        });

        it('should throw on duplicate save (unique constraint)', async () => {
            await savedJobRepository.save(testUserId, testJobId);
            await expect(savedJobRepository.save(testUserId, testJobId)).rejects.toThrow();
        });
    });

    describe('remove()', () => {
        it('should remove a saved job', async () => {
            await savedJobRepository.save(testUserId, testJobId);
            await savedJobRepository.remove(testUserId, testJobId);
            const exists = await savedJobRepository.existsByUserAndJob(testUserId, testJobId);
            expect(exists).toBe(false);
        });

        it('should throw Prisma P2025 when removing non-existent saved job', async () => {
            await expect(savedJobRepository.remove(testUserId, testJobId)).rejects.toMatchObject({ code: 'P2025' });
        });
    });

    describe('findAllByUserId()', () => {
        it('should return full job objects for saved jobs', async () => {
            await savedJobRepository.save(testUserId, testJobId);
            const jobs = await savedJobRepository.findAllByUserId(testUserId);
            expect(jobs).toHaveLength(1);
            expect(jobs[0].id).toBe(testJobId);
            expect(jobs[0].title).toBe('SWE');
        });
    });
});
