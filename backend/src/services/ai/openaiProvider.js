const axios = require('axios');

class OpenAIProvider {
    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || 'mock_key';
        this.isMock = this.apiKey === 'mock_key' || this.apiKey === 'YOUR_OPENAI_API_KEY';
        this.model = process.env.OPENAI_MODEL || 'gpt-4o';
    }

    async generateSuggestions(prompt) {
        if (this.isMock || process.env.NODE_ENV === 'test') {
            console.log('[OpenAIProvider] Using mock suggestions response...');
            return JSON.stringify(this.getMockResponse());
        }

        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: this.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const text = response.data?.choices?.[0]?.message?.content;
            if (!text) {
                throw new Error('Empty response from OpenAI API');
            }
            return text;
        } catch (error) {
            console.error('[OpenAIProvider] Error:', error.message);
            throw error;
        }
    }

    getMockResponse() {
        return {
            overallAssessment: "OpenAI Assessment: The resume matches backend requirements well but shows gaps in container configuration and cloud deployment.",
            strengths: ["Experienced with Node.js and SQL", "Understands microservices design patterns"],
            weaknesses: ["Missing Docker integration", "No AWS cloud experience"],
            missingSkillsExplanation: ["Docker: Crucial for development pipelines.", "AWS: Deployment engine for backend systems."],
            resumeImprovements: ["Include environment orchestration experience", "Detail your CI/CD knowledge"],
            suggestedBulletPoints: ["Dockerized backends to ensure environment uniformity.", "Hosted application clusters on AWS VPC."],
            projectRecommendations: ["Build a Dockerized container network deploying to AWS Fargate."],
            atsOptimizationTips: ["Ensure Docker and AWS are formatted as standard skills keywords."]
        };
    }
}

module.exports = OpenAIProvider;
