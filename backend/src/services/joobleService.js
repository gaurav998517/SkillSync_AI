const axios = require('axios');
const { extractSkills } = require('./skillExtractionService');

/**
 * Parse minimum experience from text snippet/description.
 * @param {string} text 
 * @returns {number}
 */
const parseMinExperience = (text) => {
    if (!text) return 0;
    
    const regexes = [
        /(\d+)\s*\+?\s*year[s]?\s*(?:of\s*)?experience/i,
        /(\d+)\s*\+?\s*yr[s]?\s*(?:of\s*)?experience/i,
        /(\d+)\s*year[s]?\s*req/i,
        /minimum\s*(?:of\s*)?(\d+)\s*year[s]?/i,
        /(\d+)\s*\+\s*year[s]?/i,
        /(\d+)\s*yr[s]?\s*\+/i
    ];
    
    for (const regex of regexes) {
        const match = text.match(regex);
        if (match) {
            const val = parseInt(match[1], 10);
            if (!isNaN(val) && val > 0 && val < 20) {
                return val;
            }
        }
    }
    
    return 1; // Default to 1
};

/**
 * Fetch jobs from Jooble API.
 * @param {string} keywords 
 * @param {string} location 
 * @returns {Promise<Array>}
 */
const fetchJobsFromJooble = async (keywords, location) => {
    const apiKey = process.env.JOB_API;
    if (!apiKey) {
        throw new Error('Jooble API key (JOB_API) is not configured in environment variables.');
    }

    const url = `https://jooble.org/api/${apiKey}`;
    const body = {
        keywords: keywords || '',
        location: location || '',
    };

    try {
        const response = await axios.post(url, body, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });

        const data = response.data;
        if (!data || !Array.isArray(data.jobs)) {
            console.warn('[JOOBLE SERVICE] Unexpected response format from Jooble:', data);
            return [];
        }

        return data.jobs.map(job => {
            const description = job.snippet ? job.snippet.replace(/<\/?[^>]+(>|$)/g, "") : '';
            const extractedSkills = extractSkills(description + ' ' + job.title);
            
            // If no skills are extracted, default to using the query keywords
            const requiredSkills = extractedSkills.length > 0 
                ? extractedSkills 
                : (keywords ? [keywords.toLowerCase().trim()] : ['javascript']);

            return {
                title: job.title || 'Software Developer',
                company: job.company || 'Unknown Company',
                requiredSkills: requiredSkills.map(s => s.toLowerCase().trim()),
                minExperience: parseMinExperience(description),
                description: `${description}\n\nApply here: ${job.link || ''}`,
            };
        });
    } catch (error) {
        console.error('[JOOBLE SERVICE] Failed to fetch jobs from Jooble API:', error.message);
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch from Jooble API');
    }
};

module.exports = {
    fetchJobsFromJooble,
    parseMinExperience,
};
