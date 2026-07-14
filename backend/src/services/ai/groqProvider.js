const Groq = require('groq-sdk');

class GroqProvider {
    constructor() {
        const apiKey = process.env.GROQ_API_KEY || 'mock_key';
        this.isMock = apiKey === 'mock_key' || apiKey === 'YOUR_GROQ_API_KEY';
        
        if (!this.isMock) {
            this.client = new Groq({
                apiKey: apiKey,
                timeout: 30 * 1000 // 30 seconds timeout
            });
        }
        this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    }

    /**
     * Generates suggestions based on prompt
     * @param {string} prompt 
     */
    async generateSuggestions(prompt) {
        if (this.isMock || process.env.NODE_ENV === 'test') {
            console.log('[GroqProvider] Using mock suggestions response...');
            return JSON.stringify(this.getMockResponse());
        }

        const executeRequest = async () => {
            const chatCompletion = await this.client.chat.completions.create({
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                model: this.model,
                temperature: 0.2,
                response_format: { type: "json_object" }
            });
            return chatCompletion.choices[0]?.message?.content;
        };

        return this.withRetry(executeRequest);
    }

    /**
     * Retry logic with exponential backoff
     */
    async withRetry(fn, retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                const status = error.status;
                const isRateLimit = status === 429;
                const isServerError = status >= 500 && status < 600;
                const isTimeout = error.name === 'APITimeoutError' || error.message?.toLowerCase().includes('timeout');

                if ((isRateLimit || isServerError || isTimeout) && i < retries - 1) {
                    const backoff = delay * Math.pow(2, i);
                    console.warn(`[GroqProvider] Request failed. Error: ${error.message}. Retrying in ${backoff}ms (Attempt ${i + 1}/${retries})...`);
                    await new Promise(resolve => setTimeout(resolve, backoff));
                } else {
                    console.error('[GroqProvider] Final request failure:', error);
                    throw error;
                }
            }
        }
    }

    /**
     * Mock response for local development/testing when GROQ_API_KEY is not defined
     */
    getMockResponse() {
        return {
            overallAssessment: "The candidate shows strong foundational knowledge in backend development and cloud setup, but requires additional optimization and documentation of key containerization tools to match the target Senior Engineer position.",
            strengths: [
                "Demonstrated experience in Javascript and Node.js REST API development.",
                "Robust understanding of JWT authentication and database indexing principles."
            ],
            weaknesses: [
                "Lack of container deployment experience using Docker.",
                "Limited mentions of AWS cloud infrastructure or serverless deployment models."
            ],
            missingSkillsExplanation: [
                "Docker: The job requires containerizing backend microservices to ensure environment consistency.",
                "AWS: Deployment and orchestration services on AWS (like ECS or EKS) are key to the job's infrastructure requirements."
            ],
            resumeImprovements: [
                "Include a dedicated section for Cloud and DevOps technologies.",
                "Quantify achievements under past roles, showing scale and system optimization numbers."
            ],
            suggestedBulletPoints: [
                "Containerized core Node.js microservices using Docker, decreasing onboarding setup time by 40%.",
                "Deployed and maintained REST APIs on AWS EC2/ECS instances, ensuring 99.9% uptime with Auto-Scaling."
            ],
            projectRecommendations: [
                "Build a multi-container Dockerized application deploying to AWS ECS using a CI/CD pipeline (GitHub Actions).",
                "Create a serverless API on AWS Lambda utilizing API Gateway and DynamoDB."
            ],
            atsOptimizationTips: [
                "Ensure skills like 'Docker' and 'AWS' are explicitly spelled out in the skills list, rather than just referenced inside project descriptions.",
                "Use a clean single-column PDF layout to ensure parsing parsers parse headers correctly."
            ]
        };
    }
}

module.exports = GroqProvider;
