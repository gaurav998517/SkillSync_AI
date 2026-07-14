const jobRepository = require('../repositories/jobRepository');
const joobleService = require('../services/joobleService');

/**
 * @desc    Create a new job
 * @route   POST /api/jobs
 * @access  Private (recruiter, admin)
 */
const createJob = async (req, res) => {
    try {
        const { title, company, requiredSkills, minExperience, description } = req.body;

        if (!title || !company || !requiredSkills || !Array.isArray(requiredSkills) || requiredSkills.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, company, and an array of requiredSkills',
            });
        }

        const job = await jobRepository.create({ title, company, requiredSkills, minExperience, description });

        // Normalize id → _id for frontend compatibility
        const { id, ...rest } = job;
        return res.status(201).json({ success: true, data: { _id: id, ...rest } });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error creating job' });
    }
};

/**
 * @desc    Get all active jobs
 * @route   GET /api/jobs
 * @access  Public
 */
const getAllJobs = async (req, res) => {
    try {
        const jobs = await jobRepository.findAll();

        // Normalize id → _id for all jobs
        const normalized = jobs.map(({ id, ...rest }) => ({ _id: id, ...rest }));

        return res.status(200).json({ success: true, count: normalized.length, data: normalized });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ success: false, message: 'Server error fetching jobs' });
    }
};

/**
 * @desc    Seed database with dummy jobs (idempotent)
 * @route   POST /api/jobs/seed
 * @access  Private (recruiter, admin)
 */
const seedDummyJobs = async (req, res) => {
    try {
        const dummyJobs = [
            {
                title: 'Senior Frontend Developer',
                company: 'Tech Innovators Inc.',
                requiredSkills: ['react', 'typescript', 'javascript', 'css', 'html', 'git'],
                minExperience: 5,
                description: 'We are looking for an experienced Frontend Developer to lead our UI team.',
            },
            {
                title: 'Backend Engineer',
                company: 'DataFlow Systems',
                requiredSkills: ['node.js', 'express', 'mongodb', 'api design', 'python'],
                minExperience: 3,
                description: 'Join our backend team to build scalable microservices and APIs.',
            },
            {
                title: 'Full Stack Web Developer',
                company: 'StartupX',
                requiredSkills: ['javascript', 'react', 'node.js', 'mongodb', 'aws', 'docker'],
                minExperience: 2,
                description: 'A dynamic role requiring end-to-end development of our core product.',
            },
            {
                title: 'Data Scientist',
                company: 'AI Solutions Ltd',
                requiredSkills: ['python', 'machine learning', 'sql', 'pandas', 'tensorflow'],
                minExperience: 4,
                description: 'Seeking a Data Scientist to build predictive models and analyze complex datasets.',
            },
            {
                title: 'DevOps Engineer',
                company: 'Cloud Native Corp',
                requiredSkills: ['linux', 'docker', 'kubernetes', 'aws', 'ci/cd', 'terraform'],
                minExperience: 3,
                description: 'Help us automate and scale our cloud infrastructure.',
            },
        ];

        const result = await jobRepository.createMany(dummyJobs);

        return res.status(201).json({
            success: true,
            count: result.count,
            message: `${result.count} dummy jobs seeded successfully`,
        });
    } catch (error) {
        console.error('Error seeding dummy jobs:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error seeding jobs' });
    }
};

/**
 * @desc    Fetch and import jobs from Jooble API
 * @route   POST /api/jobs/import-jooble
 * @access  Private (recruiter, admin)
 */
const importJoobleJobs = async (req, res) => {
    try {
        const { keywords, location } = req.body;

        if (!keywords) {
            return res.status(400).json({
                success: false,
                message: 'Please provide search keywords for Jooble API',
            });
        }

        const joobleJobs = await joobleService.fetchJobsFromJooble(keywords, location);
        
        if (joobleJobs.length === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                message: 'No jobs found on Jooble matching the criteria',
            });
        }

        const result = await jobRepository.createMany(joobleJobs);

        return res.status(201).json({
            success: true,
            count: result.count,
            message: `Successfully imported ${result.count} jobs from Jooble`,
        });
    } catch (error) {
        console.error('Error importing jobs from Jooble:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error importing jobs from Jooble' });
    }
};

module.exports = { createJob, getAllJobs, seedDummyJobs, importJoobleJobs };
