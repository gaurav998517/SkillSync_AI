/**
 * Unit Tests — JobRepository
 */
const { PrismaClient } = require('@prisma/client');
const jobRepository = require('../../../repositories/jobRepository');

const prisma = new PrismaClient();

beforeAll(async () => await prisma.$connect());
afterEach(async () => {
    await prisma.savedJob.deleteMany({});
    await prisma.matchResult.deleteMany({});
    await prisma.aiSuggestion.deleteMany({});
    await prisma.job.deleteMany({});
});
afterAll(async () => await prisma.$disconnect());

describe('JobRepository', () => {
    const baseJob = {
        title: 'Backend Engineer',
        company: 'TestCorp',
        requiredSkills: ['Node.js', 'PostgreSQL', 'Docker'],
        minExperience: 3,
        description: 'Build APIs.',
    };

    describe('create()', () => {
        it('should create a job with normalized skills', async () => {
            const job = await jobRepository.create(baseJob);
            expect(job.id).toBeDefined();
            expect(job.title).toBe('Backend Engineer');
            expect(job.requiredSkills).toContain('node.js');
            expect(job.requiredSkills).toContain('postgresql');
        });

        it('should deduplicate required skills', async () => {
            const job = await jobRepository.create({
                ...baseJob,
                requiredSkills: ['React', 'react', 'REACT'],
            });
            expect(job.requiredSkills.length).toBe(1);
            expect(job.requiredSkills[0]).toBe('react');
        });
    });

    describe('findAll()', () => {
        it('should return only active jobs', async () => {
            const job = await jobRepository.create(baseJob);
            await jobRepository.softDelete(job.id);

            const jobs = await jobRepository.findAll();
            const deletedJob = jobs.find((j) => j.id === job.id);
            expect(deletedJob).toBeUndefined();
        });

        it('should return all active jobs', async () => {
            await jobRepository.create(baseJob);
            await jobRepository.create({ ...baseJob, title: 'Frontend Dev' });
            const jobs = await jobRepository.findAll();
            expect(jobs.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('softDelete()', () => {
        it('should set isActive=false, not remove the row', async () => {
            const job = await jobRepository.create(baseJob);
            await jobRepository.softDelete(job.id);

            const raw = await prisma.job.findUnique({ where: { id: job.id } });
            expect(raw.isActive).toBe(false);
        });
    });
});
