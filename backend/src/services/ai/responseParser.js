/**
 * Response Parser Service for AI Resume Suggestions
 */
const parseResponse = (rawResponse) => {
    if (!rawResponse || typeof rawResponse !== 'string') {
        return getFallbackResponse('Received empty or invalid response from AI provider.');
    }

    let cleaned = rawResponse.trim();

    // Strip Markdown code block wrapper if present
    if (cleaned.startsWith('```')) {
        // Find the first newline to strip opening wrapper (e.g., ```json or ```)
        const firstNewLineIndex = cleaned.indexOf('\n');
        if (firstNewLineIndex !== -1) {
            cleaned = cleaned.substring(firstNewLineIndex).trim();
        }
        // Strip ending wrapper
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.substring(0, cleaned.length - 3).trim();
        }
    }

    try {
        const parsed = JSON.parse(cleaned);

        // Validate structure and fill missing keys with defaults
        const result = {
            overallAssessment: parsed.overallAssessment || 'No assessment provided.',
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
            missingSkillsExplanation: Array.isArray(parsed.missingSkillsExplanation) ? parsed.missingSkillsExplanation : [],
            resumeImprovements: Array.isArray(parsed.resumeImprovements) ? parsed.resumeImprovements : [],
            suggestedBulletPoints: Array.isArray(parsed.suggestedBulletPoints) ? parsed.suggestedBulletPoints : [],
            projectRecommendations: Array.isArray(parsed.projectRecommendations) ? parsed.projectRecommendations : [],
            atsOptimizationTips: Array.isArray(parsed.atsOptimizationTips) ? parsed.atsOptimizationTips : []
        };

        return result;
    } catch (error) {
        console.error('[ResponseParser] Failed to parse AI suggestions JSON. Raw content was:', rawResponse);
        console.error('[ResponseParser] Parse error:', error);
        return getFallbackResponse('Failed to parse response format from AI provider. Raw response was not valid JSON.');
    }
};

/**
 * Returns a fallback structured object when parsing fails
 */
const getFallbackResponse = (errorMessage) => {
    return {
        overallAssessment: `Error: ${errorMessage}. The matching service could not parse the detailed suggestions.`,
        strengths: ["Review your resume matches to determine key strengths."],
        weaknesses: ["Unable to fetch detailed weaknesses."],
        missingSkillsExplanation: ["Compare your skills section with the job description directly."],
        resumeImprovements: ["Double-check formatting and structure manually."],
        suggestedBulletPoints: ["Consider rewriting bullets with action verbs and quantifiable results."],
        projectRecommendations: ["Create a portfolio project demonstrating one of your missing skills."],
        atsOptimizationTips: ["Ensure your contact information is readable and you use common section headers."]
    };
};

module.exports = {
    parseResponse,
    getFallbackResponse
};
