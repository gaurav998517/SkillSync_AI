const axios = require('axios');

class GeminiProvider {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || 'mock_key';
        this.isMock = this.apiKey === 'mock_key' || this.apiKey === 'YOUR_GEMINI_API_KEY';
        this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    }

    async generateSuggestions(prompt) {
        if (this.isMock || process.env.NODE_ENV === 'test') {
            console.log('[GeminiProvider] Using mock suggestions response...');
            return JSON.stringify(this.getMockResponse());
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
            const response = await axios.post(url, {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            }, {
                timeout: 30000
            });

            const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error('Empty response from Gemini API');
            }
            return text;
        } catch (error) {
            console.error('[GeminiProvider] Error:', error.message);
            throw error;
        }
    }

    getMockResponse() {
        return {
            overallAssessment: "Gemini Assessment: The candidate has solid technical foundation, but lacks containerization and cloud experience key to this senior role.",
            strengths: ["Strong backend developer skills", "Knowledge of relational databases"],
            weaknesses: ["No Docker exposure", "No AWS experience listed"],
            missingSkillsExplanation: ["Docker: Important for microservice packaging.", "AWS: Deployment infrastructure requirement."],
            resumeImprovements: ["Add a DevOps skills section", "Describe project architectures"],
            suggestedBulletPoints: ["Dockerized legacy APIs, simplifying setup.", "Configured AWS ECS nodes for deployment."],
            projectRecommendations: ["Create a Dockerized Node app deployed on AWS."],
            atsOptimizationTips: ["Spell out Docker and AWS in your skills section."]
        };
    }
}

module.exports = GeminiProvider;
