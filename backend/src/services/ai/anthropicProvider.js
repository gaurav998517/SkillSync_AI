const axios = require('axios');

class AnthropicProvider {
    constructor() {
        this.apiKey = process.env.ANTHROPIC_API_KEY || 'mock_key';
        this.isMock = this.apiKey === 'mock_key' || this.apiKey === 'YOUR_ANTHROPIC_API_KEY';
        this.model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    }

    async generateSuggestions(prompt) {
        if (this.isMock || process.env.NODE_ENV === 'test') {
            console.log('[AnthropicProvider] Using mock suggestions response...');
            return JSON.stringify(this.getMockResponse());
        }

        try {
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
                model: this.model,
                max_tokens: 4000,
                messages: [
                    { role: 'user', content: prompt }
                ]
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            const text = response.data?.content?.[0]?.text;
            if (!text) {
                throw new Error('Empty response from Anthropic API');
            }
            return text;
        } catch (error) {
            console.error('[AnthropicProvider] Error:', error.message);
            throw error;
        }
    }

    getMockResponse() {
        return {
            overallAssessment: "Anthropic Assessment: Strong resume alignment with core engineering concepts, with technical gaps in container orchestration and AWS infrastructure deployment.",
            strengths: ["Excellent database setup and routing control", "Proper usage of MVC routing architectures"],
            weaknesses: ["Missing Docker integration", "No AWS deployment credentials"],
            missingSkillsExplanation: ["Docker: Important to create reproducible testing frameworks.", "AWS: The primary host environment for this role's APIs."],
            resumeImprovements: ["Elaborate on scaling and hosting steps", "Add containerization experiences"],
            suggestedBulletPoints: ["Dockerized dev environment, decreasing environment setup errors by 30%.", "Engineered scalable cloud hosting configurations on AWS ECS."],
            projectRecommendations: ["Create a serverless container system deployed to AWS ECS/Fargate."],
            atsOptimizationTips: ["Ensure Docker and AWS are included in top-level resume header labels."]
        };
    }
}

module.exports = AnthropicProvider;
