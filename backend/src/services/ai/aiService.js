const GroqProvider = require('./groqProvider');
const GeminiProvider = require('./geminiProvider');
const OpenAIProvider = require('./openaiProvider');
const AnthropicProvider = require('./anthropicProvider');
const { buildPrompt } = require('./promptBuilder');
const { parseResponse } = require('./responseParser');

class AIService {
    constructor() {
        const providerName = (process.env.AI_PROVIDER || 'groq').toLowerCase();
        this.providerName = providerName;
        
        switch (providerName) {
            case 'gemini':
                this.provider = new GeminiProvider();
                break;
            case 'openai':
                this.provider = new OpenAIProvider();
                break;
            case 'anthropic':
                this.provider = new AnthropicProvider();
                break;
            case 'groq':
            default:
                this.provider = new GroqProvider();
                break;
        }
        console.log(`[AIService] Active AI Provider: ${providerName.toUpperCase()}`);
    }

    /**
     * Generates resume suggestions based on resume and job details
     * @param {object} promptData 
     * @returns {Promise<object>} Suggestions JSON object
     */
    async getResumeSuggestions(promptData) {
        const prompt = buildPrompt(promptData);
        const rawResponse = await this.provider.generateSuggestions(prompt);
        return parseResponse(rawResponse);
    }
}

// Export singleton instance
module.exports = new AIService();
