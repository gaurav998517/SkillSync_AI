const { prisma } = require('../config/database');
const jobRepository = require('../repositories/jobRepository');

const dummyJobs = [
    {
        title: 'Senior Frontend Developer',
        company: 'Tech Innovators Inc.',
        requiredSkills: ['react', 'typescript', 'javascript', 'css', 'html', 'git'],
        minExperience: 5,
        description: 'We are looking for an experienced Frontend Developer to lead our UI team. You will drive front-end best practices and collaborate with product teams to build stunning dashboards.'
    },
    {
        title: 'Backend Engineer',
        company: 'DataFlow Systems',
        requiredSkills: ['node.js', 'express', 'mongodb', 'api design', 'python'],
        minExperience: 3,
        description: 'Join our backend team to build scalable microservices and APIs. Responsibilities include database optimization, system performance tuning, and robust endpoint integrations.'
    },
    {
        title: 'Full Stack Web Developer',
        company: 'StartupX',
        requiredSkills: ['javascript', 'react', 'node.js', 'mongodb', 'aws', 'docker'],
        minExperience: 2,
        description: 'A dynamic role requiring end-to-end development of our core product. You will touch UI design, server logic, hosting infrastructure, and state synchronization.'
    },
    {
        title: 'Data Scientist',
        company: 'AI Solutions Ltd',
        requiredSkills: ['python', 'machine learning', 'sql', 'pandas', 'tensorflow'],
        minExperience: 4,
        description: 'Seeking a Data Scientist to build predictive models and analyze complex datasets. You will deploy models in production and perform feature engineering at scale.'
    },
    {
        title: 'DevOps Engineer',
        company: 'Cloud Native Corp',
        requiredSkills: ['linux', 'docker', 'kubernetes', 'aws', 'ci/cd', 'terraform'],
        minExperience: 3,
        description: 'Help us automate and scale our cloud infrastructure. Experience with CI/CD automation pipelines and infrastructure as code is highly desired.'
    }
];

async function seed() {
    try {
        console.log('Seeding dummy jobs to PostgreSQL...');
        const result = await jobRepository.createMany(dummyJobs);
        console.log(`Seeding completed successfully! Created ${result.count} jobs.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding jobs:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
